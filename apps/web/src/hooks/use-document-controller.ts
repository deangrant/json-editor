import { JsonFormatter } from "@json-editor/core/format/json-formatter.js";
import { HistoryStack } from "@json-editor/core/history/history-stack.js";
import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import type { TransformProgram } from "@json-editor/core/query/transform.types.js";
import { TransformEngine } from "@json-editor/core/query/transform-engine.js";
import type {
  JsonPath,
  JsonValue,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";
import { CompositeValidator } from "@json-editor/core/validate/composite-validator.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import type { DocumentContextValue } from "../contexts/document-context.js";
import { openJsonFile, saveJsonFile } from "../services/file-io.js";
import { WorkerClient } from "../services/worker-client.js";
import {
  createInitialState,
  documentReducer,
} from "../stores/document-reducer.js";
import type {
  DocumentSnapshot,
  EditorMode,
  SidePanel,
} from "../types/document.types.js";
import { createBannedFlagValidator } from "../utils/custom-validators.js";

const formatter = new JsonFormatter();
const parser = new JsonParser();
const transformEngine = new TransformEngine();

/**
 * Owns document state, history, worker jobs, and editor actions.
 * @returns Document context value for the provider.
 */
export function useDocumentController(): DocumentContextValue {
  const [state, dispatch] = useReducer(
    documentReducer,
    undefined,
    createInitialState,
  );
  const historyRef = useRef<HistoryStack<DocumentSnapshot> | null>(null);
  if (historyRef.current === null) {
    historyRef.current = new HistoryStack<DocumentSnapshot>(100);
    historyRef.current.push({ json: state.json, text: state.text });
  }
  const workerRef = useRef<WorkerClient | undefined>(undefined);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    workerRef.current = new WorkerClient();
    return () => {
      workerRef.current?.dispose();
    };
  }, []);

  const pushHistory = useCallback(
    (text: string, json: JsonValue | undefined) => {
      historyRef.current?.push({ json, text });
      setHistoryVersion((version) => version + 1);
    },
    [],
  );

  const setText = useCallback(
    (text: string) => {
      dispatch({ text, type: "setText" });
      const parsed = parser.parse(text);
      pushHistory(text, parsed.ok ? parsed.value : undefined);
    },
    [pushHistory],
  );

  const setJson = useCallback(
    (json: JsonValue) => {
      const text = formatter.beautify(json);
      dispatch({ json, text, type: "setJson" });
      pushHistory(text, json);
    },
    [pushHistory],
  );

  const setMode = useCallback((mode: EditorMode) => {
    dispatch({ mode, type: "setMode" });
  }, []);

  const setSelection = useCallback((path: JsonPath) => {
    dispatch({ path, type: "setSelection" });
  }, []);

  const setSidePanel = useCallback((panel: SidePanel) => {
    dispatch({ panel, type: "setSidePanel" });
  }, []);

  const setSchemaText = useCallback((schemaText: string) => {
    dispatch({ schemaText, type: "setSchemaText" });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ query, type: "setSearchQuery" });
  }, []);

  const setReplaceValue = useCallback((value: string) => {
    dispatch({ type: "setReplaceValue", value });
  }, []);

  const openFile = useCallback(async () => {
    const file = await openJsonFile();
    if (!file) {
      return;
    }
    dispatch({ fileName: file.fileName, text: file.text, type: "load" });
    const parsed = parser.parse(file.text);
    historyRef.current?.clear();
    historyRef.current?.push({
      json: parsed.ok ? parsed.value : undefined,
      text: file.text,
    });
    setHistoryVersion((version) => version + 1);
  }, []);

  const saveFile = useCallback(() => {
    saveJsonFile(state.text, state.fileName ?? "document.json");
    dispatch({ type: "markSaved" });
  }, [state.fileName, state.text]);

  const runFormat = useCallback(
    async (mode: "beautify" | "compact") => {
      if (state.json === undefined) {
        return;
      }
      dispatch({ busy: true, type: "setWorkerBusy" });
      try {
        const worker = workerRef.current;
        if (!worker) {
          const text =
            mode === "compact"
              ? formatter.compact(state.json)
              : formatter.beautify(state.json);
          dispatch({ json: state.json, text, type: "setJson" });
          pushHistory(text, state.json);
          return;
        }
        const response = await worker.run({
          mode,
          type: "format",
          value: state.json,
        });
        if (
          response.ok &&
          response.result.type === "format" &&
          state.json !== undefined
        ) {
          dispatch({
            json: state.json,
            text: response.result.text,
            type: "setJson",
          });
          pushHistory(response.result.text, state.json);
        }
      } finally {
        dispatch({ busy: false, type: "setWorkerBusy" });
      }
    },
    [pushHistory, state.json],
  );

  const format = useCallback(async () => {
    await runFormat("beautify");
  }, [runFormat]);

  const compact = useCallback(async () => {
    await runFormat("compact");
  }, [runFormat]);

  const repair = useCallback(async () => {
    dispatch({ busy: true, type: "setWorkerBusy" });
    try {
      const worker = workerRef.current;
      if (!worker) {
        return;
      }
      const response = await worker.run({ text: state.text, type: "repair" });
      if (response.ok && response.result.type === "repair") {
        dispatch({
          text: response.result.text,
          type: "setRepairSuggestion",
        });
      }
    } finally {
      dispatch({ busy: false, type: "setWorkerBusy" });
    }
  }, [state.text]);

  const acceptRepair = useCallback(() => {
    if (!state.repairSuggestion) {
      return;
    }
    setText(state.repairSuggestion);
    dispatch({ text: undefined, type: "setRepairSuggestion" });
  }, [setText, state.repairSuggestion]);

  const validate = useCallback(async () => {
    if (state.json === undefined) {
      dispatch({ issues: [], type: "setValidationIssues" });
      return;
    }

    dispatch({ busy: true, type: "setWorkerBusy" });
    try {
      let schemaIssues: ValidationIssue[] = [];
      const schemaText = state.schemaText.trim();
      if (schemaText.length > 0) {
        const schemaParsed = parser.parse(schemaText);
        if (!schemaParsed.ok) {
          dispatch({
            issues: [
              {
                message: `Schema is not valid JSON: ${schemaParsed.error.message}`,
                path: [],
                severity: "error",
                source: "schema",
              },
            ],
            type: "setValidationIssues",
          });
          return;
        }

        const worker = workerRef.current;
        if (worker) {
          const response = await worker.run({
            schema: schemaParsed.value as object,
            type: "validate",
            value: state.json,
          });
          if (response.ok && response.result.type === "validate") {
            schemaIssues = response.result.issues;
          }
        }
      }

      const custom = new CompositeValidator([createBannedFlagValidator()]);
      const customIssues = custom.validate(state.json);
      dispatch({
        issues: [...schemaIssues, ...customIssues],
        type: "setValidationIssues",
      });
    } finally {
      dispatch({ busy: false, type: "setWorkerBusy" });
    }
  }, [state.json, state.schemaText]);

  const undo = useCallback(() => {
    const snapshot = historyRef.current?.undo();
    if (!snapshot) {
      return;
    }
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, []);

  const redo = useCallback(() => {
    const snapshot = historyRef.current?.redo();
    if (!snapshot) {
      return;
    }
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, []);

  const applyTransform = useCallback(
    async (program: TransformProgram) => {
      if (state.json === undefined) {
        return;
      }
      dispatch({ busy: true, type: "setWorkerBusy" });
      try {
        const worker = workerRef.current;
        if (worker) {
          const response = await worker.run({
            program,
            type: "transform",
            value: state.json,
          });
          if (response.ok && response.result.type === "transform") {
            setJson(response.result.value);
            dispatch({ preview: undefined, type: "setTransformPreview" });
            return;
          }
        }
        const local = transformEngine.apply(state.json, program);
        if (local.ok) {
          setJson(local.value);
          dispatch({ preview: undefined, type: "setTransformPreview" });
        } else {
          dispatch({
            preview: local.message,
            type: "setTransformPreview",
          });
        }
      } finally {
        dispatch({ busy: false, type: "setWorkerBusy" });
      }
    },
    [setJson, state.json],
  );

  const previewTransform = useCallback(
    (program: TransformProgram) => {
      if (state.json === undefined) {
        return Promise.resolve();
      }
      const result = transformEngine.preview(state.json, program);
      if (!result.ok) {
        dispatch({ preview: result.message, type: "setTransformPreview" });
        return Promise.resolve();
      }
      dispatch({
        preview: formatter.beautify(result.value),
        type: "setTransformPreview",
      });
      return Promise.resolve();
    },
    [state.json],
  );

  const replaceInText = useCallback(
    (query: string, replacement: string, all: boolean) => {
      if (!query) {
        return;
      }
      if (all) {
        setText(state.text.split(query).join(replacement));
        return;
      }
      const index = state.text.indexOf(query);
      if (index === -1) {
        return;
      }
      setText(
        state.text.slice(0, index) +
          replacement +
          state.text.slice(index + query.length),
      );
    },
    [setText, state.text],
  );

  // historyVersion triggers re-render so undo/redo flags stay current.
  const canUndo =
    historyVersion >= 0 && (historyRef.current?.canUndo() ?? false);
  const canRedo =
    historyVersion >= 0 && (historyRef.current?.canRedo() ?? false);

  return useMemo<DocumentContextValue>(
    () => ({
      acceptRepair,
      applyTransform,
      canRedo,
      canUndo,
      compact,
      format,
      openFile,
      previewTransform,
      redo,
      repair,
      replaceInText,
      saveFile,
      setJson,
      setMode,
      setReplaceValue,
      setSchemaText,
      setSearchQuery,
      setSelection,
      setSidePanel,
      setText,
      state,
      undo,
      validate,
    }),
    [
      acceptRepair,
      applyTransform,
      canRedo,
      canUndo,
      compact,
      format,
      openFile,
      previewTransform,
      redo,
      repair,
      replaceInText,
      saveFile,
      setJson,
      setMode,
      setReplaceValue,
      setSchemaText,
      setSearchQuery,
      setSelection,
      setSidePanel,
      setText,
      state,
      undo,
      validate,
    ],
  );
}

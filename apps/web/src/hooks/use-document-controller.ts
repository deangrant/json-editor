import { LARGE_DOCUMENT_BYTES } from "@json-editor/core/constants.js";
import type { IHistoryStack } from "@json-editor/core/history/i-history-stack.js";
import type { TransformProgram } from "@json-editor/core/query/transform.types.js";
import type {
  JsonPath,
  JsonValue,
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
import { runPromise } from "../utils/run-promise.js";
import {
  createDefaultDocumentControllerDeps,
  type DocumentControllerDeps,
  type WorkerPort,
} from "./document-controller/deps.js";
import { decideHistoryWrite } from "./document-controller/history-policy.js";
import {
  outcomeFromLocalParse,
  outcomeFromWorkerParseResponse,
  type ParseOutcome,
} from "./document-controller/parse-outcomes.js";
import { collectSchemaIssues } from "./document-controller/schema-validation.js";

/** Debounce window for streaming text edits before worker parse. */
const PARSE_DEBOUNCE_MS = 100;

/** Coalesce window for rapid history snapshots (typing / table edits). */
const HISTORY_COALESCE_MS = 500;

const defaultDeps = createDefaultDocumentControllerDeps();

/**
 * Owns document state, history, worker jobs, and editor actions.
 * @param deps Optional collaborators; defaults to production adapters.
 * @returns Document context value for the provider.
 */
export function useDocumentController(
  deps: DocumentControllerDeps = defaultDeps,
): DocumentContextValue {
  const { formatter, transformEngine, fileIo } = deps;
  const depsRef = useRef(deps);

  const [state, dispatch] = useReducer(
    documentReducer,
    undefined,
    createInitialState,
  );
  const [history] = useState<IHistoryStack<DocumentSnapshot>>(() => {
    const stack = deps.createHistory();
    const initial = createInitialState();
    stack.push({ json: initial.json, text: initial.text });
    return stack;
  });
  const workerSeed: WorkerPort | undefined = undefined;
  const workerRef = useRef(workerSeed);
  const parseGenerationRef = useRef(0);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const parseBusyOwnerRef = useRef<number | undefined>(undefined);
  const workerJobIdRef = useRef(0);
  const workerBusyCountRef = useRef(0);
  const lastHistoryPushAtRef = useRef(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    depsRef.current = deps;
  });

  useEffect(() => {
    workerRef.current = depsRef.current.createWorker();
    return () => {
      if (parseTimerRef.current !== undefined) {
        clearTimeout(parseTimerRef.current);
      }
      parseGenerationRef.current += 1;
      workerRef.current?.dispose();
    };
  }, []);

  const syncWorkerBusy = useCallback(() => {
    const busy =
      workerBusyCountRef.current > 0 || parseBusyOwnerRef.current !== undefined;
    dispatch({ busy, type: "setWorkerBusy" });
  }, []);

  const beginWorkerJob = useCallback(() => {
    workerJobIdRef.current += 1;
    workerBusyCountRef.current += 1;
    syncWorkerBusy();
    return workerJobIdRef.current;
  }, [syncWorkerBusy]);

  const endWorkerJob = useCallback(() => {
    workerBusyCountRef.current = Math.max(0, workerBusyCountRef.current - 1);
    syncWorkerBusy();
  }, [syncWorkerBusy]);

  const pushHistory = useCallback(
    (
      text: string,
      json: JsonValue | undefined,
      options?: { readonly force?: boolean },
    ) => {
      const current = history.current();
      const now = Date.now();
      const decision = decideHistoryWrite({
        coalesceMs: HISTORY_COALESCE_MS,
        currentText: current?.text,
        force: options?.force === true,
        lastPushAt: lastHistoryPushAtRef.current,
        nextText: text,
        now,
      });
      if (decision === "skip") {
        return;
      }
      if (decision === "replace") {
        history.replacePresent({ json, text });
      } else {
        history.push({ json, text });
      }
      lastHistoryPushAtRef.current = now;
      setHistoryVersion((version) => version + 1);
    },
    [history],
  );

  const invalidatePendingParse = useCallback(() => {
    parseGenerationRef.current += 1;
    if (parseTimerRef.current !== undefined) {
      clearTimeout(parseTimerRef.current);
      parseTimerRef.current = undefined;
    }
  }, []);

  const runParse = useCallback(
    async (text: string, generation: number, forceHistory = false) => {
      const bytes = new TextEncoder().encode(text).byteLength;
      const showBusy = bytes >= LARGE_DOCUMENT_BYTES;
      if (showBusy) {
        parseBusyOwnerRef.current = generation;
        syncWorkerBusy();
      }

      try {
        const worker = workerRef.current;
        let outcome: ParseOutcome;
        if (worker) {
          const response = await worker.run({ text, type: "parse" });
          if (generation !== parseGenerationRef.current) {
            return;
          }
          outcome = outcomeFromWorkerParseResponse(response);
        } else {
          outcome = outcomeFromLocalParse(text);
          if (generation !== parseGenerationRef.current) {
            return;
          }
        }

        const { json, parseError } = outcome;
        dispatch({
          json,
          parseError,
          text,
          type: "applyParseResult",
        });
        pushHistory(text, json, { force: forceHistory });
      } finally {
        if (parseBusyOwnerRef.current === generation) {
          parseBusyOwnerRef.current = undefined;
          syncWorkerBusy();
        }
      }
    },
    [pushHistory, syncWorkerBusy],
  );

  const scheduleParse = useCallback(
    (text: string) => {
      parseGenerationRef.current += 1;
      const generation = parseGenerationRef.current;
      if (parseTimerRef.current !== undefined) {
        clearTimeout(parseTimerRef.current);
      }
      parseTimerRef.current = setTimeout(() => {
        parseTimerRef.current = undefined;
        runPromise(runParse(text, generation));
      }, PARSE_DEBOUNCE_MS);
    },
    [runParse],
  );

  const parseNow = useCallback(
    (text: string) => {
      parseGenerationRef.current += 1;
      const generation = parseGenerationRef.current;
      if (parseTimerRef.current !== undefined) {
        clearTimeout(parseTimerRef.current);
        parseTimerRef.current = undefined;
      }
      return runParse(text, generation, true);
    },
    [runParse],
  );

  const setText = useCallback(
    (text: string) => {
      dispatch({ text, type: "setText" });
      scheduleParse(text);
    },
    [scheduleParse],
  );

  const setJson = useCallback(
    (json: JsonValue) => {
      invalidatePendingParse();
      const text = formatter.beautify(json);
      dispatch({ json, text, type: "setJson" });
      pushHistory(text, json);
    },
    [formatter, invalidatePendingParse, pushHistory],
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
    const file = await fileIo.openJsonFile();
    if (!file) {
      return;
    }
    dispatch({ fileName: file.fileName, text: file.text, type: "load" });
    history.clear();
    lastHistoryPushAtRef.current = 0;
    setHistoryVersion((version) => version + 1);
    await parseNow(file.text);
  }, [fileIo, history, parseNow]);

  const saveFile = useCallback(() => {
    fileIo.saveJsonFile(state.text, state.fileName ?? "document.json");
    dispatch({ type: "markSaved" });
  }, [fileIo, state.fileName, state.text]);

  const runFormat = useCallback(
    async (mode: "beautify" | "compact") => {
      const { json } = state;
      if (json === undefined) {
        return;
      }
      const jobId = beginWorkerJob();
      try {
        const worker = workerRef.current;
        if (!worker) {
          if (jobId !== workerJobIdRef.current) {
            return;
          }
          const text =
            mode === "compact"
              ? formatter.compact(json)
              : formatter.beautify(json);
          dispatch({ json, text, type: "setJson" });
          pushHistory(text, json, { force: true });
          return;
        }
        const response = await worker.run({
          mode,
          type: "format",
          value: json,
        });
        if (jobId !== workerJobIdRef.current) {
          return;
        }
        if (response.ok && response.result.type === "format") {
          dispatch({
            json,
            text: response.result.text,
            type: "setJson",
          });
          pushHistory(response.result.text, json, { force: true });
        }
      } finally {
        endWorkerJob();
      }
    },
    [beginWorkerJob, endWorkerJob, formatter, pushHistory, state],
  );

  const format = useCallback(async () => {
    await runFormat("beautify");
  }, [runFormat]);

  const compact = useCallback(async () => {
    await runFormat("compact");
  }, [runFormat]);

  const repair = useCallback(async () => {
    const { text } = state;
    const jobId = beginWorkerJob();
    try {
      const worker = workerRef.current;
      if (!worker) {
        return;
      }
      const response = await worker.run({ text, type: "repair" });
      if (jobId !== workerJobIdRef.current) {
        return;
      }
      if (response.ok && response.result.type === "repair") {
        dispatch({
          text: response.result.text,
          type: "setRepairSuggestion",
        });
      }
    } finally {
      endWorkerJob();
    }
  }, [beginWorkerJob, endWorkerJob, state]);

  const acceptRepair = useCallback(() => {
    if (!state.repairSuggestion) {
      return;
    }
    setText(state.repairSuggestion);
    dispatch({ text: undefined, type: "setRepairSuggestion" });
  }, [setText, state.repairSuggestion]);

  const validate = useCallback(async () => {
    const { json, schemaText } = state;
    if (json === undefined) {
      dispatch({ issues: [], type: "setValidationIssues" });
      return;
    }

    const jobId = beginWorkerJob();
    try {
      const schemaResult = await collectSchemaIssues(
        json,
        schemaText.trim(),
        depsRef.current.createParser(),
        workerRef.current,
      );
      if (jobId !== workerJobIdRef.current) {
        return;
      }
      if (schemaResult.kind === "invalidSchema") {
        dispatch({
          issues: schemaResult.issues,
          type: "setValidationIssues",
        });
        return;
      }
      const custom = new CompositeValidator([createBannedFlagValidator()]);
      dispatch({
        issues: [...schemaResult.issues, ...custom.validate(json)],
        type: "setValidationIssues",
      });
    } finally {
      endWorkerJob();
    }
  }, [beginWorkerJob, endWorkerJob, state]);

  const undo = useCallback(() => {
    const snapshot = history.undo();
    if (!snapshot) {
      return;
    }
    invalidatePendingParse();
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, [history, invalidatePendingParse]);

  const redo = useCallback(() => {
    const snapshot = history.redo();
    if (!snapshot) {
      return;
    }
    invalidatePendingParse();
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, [history, invalidatePendingParse]);

  const applyTransform = useCallback(
    async (program: TransformProgram) => {
      const { json } = state;
      if (json === undefined) {
        return;
      }
      const jobId = beginWorkerJob();
      try {
        const worker = workerRef.current;
        if (worker) {
          const response = await worker.run({
            program,
            type: "transform",
            value: json,
          });
          if (jobId !== workerJobIdRef.current) {
            return;
          }
          if (response.ok && response.result.type === "transform") {
            setJson(response.result.value);
            dispatch({ preview: undefined, type: "setTransformPreview" });
            return;
          }
        }
        if (jobId !== workerJobIdRef.current) {
          return;
        }
        const local = transformEngine.apply(json, program);
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
        endWorkerJob();
      }
    },
    [beginWorkerJob, endWorkerJob, setJson, state, transformEngine],
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
    [formatter, state.json, transformEngine],
  );

  const replaceInText = useCallback(
    (query: string, replacement: string, all: boolean) => {
      if (state.mode !== "text" || !query) {
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
    [setText, state.mode, state.text],
  );

  // Include historyVersion so state bumps refresh undo/redo flags after stack mutations.
  const historyFlags = {
    canRedo: history.canRedo(),
    canUndo: history.canUndo(),
    historyVersion,
  } satisfies {
    canRedo: boolean;
    canUndo: boolean;
    historyVersion: number;
  };
  const { canUndo, canRedo } = historyFlags;

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

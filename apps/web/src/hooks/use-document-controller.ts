import { LARGE_DOCUMENT_BYTES } from "@json-editor/core/constants.js";
import { JsonFormatter } from "@json-editor/core/format/json-formatter.js";
import { HistoryStack } from "@json-editor/core/history/history-stack.js";
import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import type { TransformProgram } from "@json-editor/core/query/transform.types.js";
import { TransformEngine } from "@json-editor/core/query/transform-engine.js";
import type {
  JsonPath,
  JsonValue,
  ParseError,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";
import { CompositeValidator } from "@json-editor/core/validate/composite-validator.js";
import type { WorkerResponse } from "@json-editor/core/worker/protocol.js";
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
import { runPromise } from "../utils/run-promise.js";

const formatter = new JsonFormatter();
const parser = new JsonParser();
const transformEngine = new TransformEngine();

/** Debounce window for streaming text edits before worker parse. */
const PARSE_DEBOUNCE_MS = 100;

/** Coalesce window for rapid history snapshots (typing / table edits). */
const HISTORY_COALESCE_MS = 500;

/** Outcome of a document text parse attempt. */
interface ParseOutcome {
  readonly json: JsonValue | undefined;
  readonly parseError: ParseError | undefined;
}

/**
 * Maps a worker parse response into a document parse outcome.
 * @param response Worker response for a parse job.
 * @returns Parsed value or parse error fields for the reducer.
 */
function outcomeFromWorkerParseResponse(
  response: WorkerResponse,
): ParseOutcome {
  if (response.ok && response.result.type === "parse") {
    return { json: response.result.value, parseError: undefined };
  }
  if (!response.ok) {
    const { parseError } = response;
    return { json: undefined, parseError };
  }
  return { json: undefined, parseError: undefined };
}

/**
 * Parses text on the main thread when no worker is available.
 * @param text Document text to parse.
 * @returns Parsed value or parse error fields for the reducer.
 */
function outcomeFromLocalParse(text: string): ParseOutcome {
  const parsed = parser.parse(text);
  if (parsed.ok) {
    return { json: parsed.value, parseError: undefined };
  }
  const { error: parseError } = parsed;
  return { json: undefined, parseError };
}

/**
 * Builds a validation issue for schema text that is not JSON.
 * @param message Parser error message.
 * @returns Schema-sourced validation issue.
 */
function schemaJsonErrorIssue(message: string): ValidationIssue {
  return {
    message: `Schema is not valid JSON: ${message}`,
    path: [],
    severity: "error",
    source: "schema",
  };
}

/**
 * Maps a worker validate response to schema issues.
 * @param response Worker response for a validate job.
 * @returns Schema validation issues, or a failure issue.
 */
function schemaIssuesFromWorkerResponse(
  response: WorkerResponse,
): ValidationIssue[] {
  if (response.ok && response.result.type === "validate") {
    return response.result.issues;
  }
  if (!response.ok) {
    return [
      {
        message: `Schema validation failed: ${response.error}`,
        path: [],
        severity: "error",
        source: "schema",
      },
    ];
  }
  return [];
}

/** Result of collecting schema issues for a document value. */
type SchemaIssueCollection =
  | { readonly kind: "invalidSchema"; readonly issues: ValidationIssue[] }
  | { readonly kind: "issues"; readonly issues: ValidationIssue[] };

/**
 * Parses schema text and optionally validates `json` via the worker.
 * @param json Document value to validate.
 * @param schemaText Trimmed schema JSON text.
 * @param worker Optional worker client.
 * @returns Invalid-schema terminal issues, or collected schema issues.
 */
/** Maximum schema text size accepted for validation jobs. */
const MAX_SCHEMA_TEXT_BYTES = 256 * 1024;

async function collectSchemaIssues(
  json: JsonValue,
  schemaText: string,
  worker: WorkerClient | undefined,
): Promise<SchemaIssueCollection> {
  if (schemaText.length === 0) {
    return { issues: [], kind: "issues" };
  }

  const schemaBytes = new TextEncoder().encode(schemaText).byteLength;
  if (schemaBytes > MAX_SCHEMA_TEXT_BYTES) {
    return {
      issues: [
        {
          message: "Schema is too large to validate (max 256 KiB).",
          path: [],
          severity: "error",
          source: "schema",
        },
      ],
      kind: "invalidSchema",
    };
  }

  const schemaParsed = parser.parse(schemaText);
  if (!schemaParsed.ok) {
    return {
      issues: [schemaJsonErrorIssue(schemaParsed.error.message)],
      kind: "invalidSchema",
    };
  }

  if (!worker) {
    return { issues: [], kind: "issues" };
  }

  const response = await worker.run({
    schema: schemaParsed.value as object,
    type: "validate",
    value: json,
  });
  return {
    issues: schemaIssuesFromWorkerResponse(response),
    kind: "issues",
  };
}

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
    workerRef.current = new WorkerClient();
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
      const history = historyRef.current;
      if (!history) {
        return;
      }
      const current = history.current();
      if (current?.text === text) {
        return;
      }

      const now = Date.now();
      const force = options?.force === true;
      if (
        !force &&
        current !== undefined &&
        now - lastHistoryPushAtRef.current < HISTORY_COALESCE_MS
      ) {
        history.replacePresent({ json, text });
      } else {
        history.push({ json, text });
      }
      lastHistoryPushAtRef.current = now;
      setHistoryVersion((version) => version + 1);
    },
    [],
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
    [invalidatePendingParse, pushHistory],
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
    historyRef.current?.clear();
    lastHistoryPushAtRef.current = 0;
    await parseNow(file.text);
  }, [parseNow]);

  const saveFile = useCallback(() => {
    saveJsonFile(state.text, state.fileName ?? "document.json");
    dispatch({ type: "markSaved" });
  }, [state.fileName, state.text]);

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
    [beginWorkerJob, endWorkerJob, pushHistory, state],
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
    const snapshot = historyRef.current?.undo();
    if (!snapshot) {
      return;
    }
    invalidatePendingParse();
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, [invalidatePendingParse]);

  const redo = useCallback(() => {
    const snapshot = historyRef.current?.redo();
    if (!snapshot) {
      return;
    }
    invalidatePendingParse();
    dispatch({ snapshot, type: "restoreSnapshot" });
    setHistoryVersion((version) => version + 1);
  }, [invalidatePendingParse]);

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
    [beginWorkerJob, endWorkerJob, setJson, state],
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

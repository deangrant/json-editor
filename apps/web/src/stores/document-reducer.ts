import {
  HUGE_DOCUMENT_BYTES,
  LARGE_DOCUMENT_BYTES,
} from "@json-editor/core/constants.js";
import { JsonFormatter } from "@json-editor/core/format/json-formatter.js";
import { JsonParser } from "@json-editor/core/parse/json-parser.js";

import { DEFAULT_DOCUMENT } from "../constants/app.constants.js";
import type { DocumentAction, DocumentState } from "../types/document.types.js";

const parser = new JsonParser();
const formatter = new JsonFormatter();

/**
 * Builds the initial editor state with the default sample document.
 * @returns Initial document state.
 */
export function createInitialState(): DocumentState {
  const text = formatter.beautify(DEFAULT_DOCUMENT);
  return {
    dirty: false,
    fileName: undefined,
    json: DEFAULT_DOCUMENT,
    mode: "tree",
    parseError: undefined,
    repairSuggestion: undefined,
    replaceValue: "",
    schemaText: "",
    searchQuery: "",
    selection: [],
    sidePanel: "none",
    sizeWarning: sizeWarningFor(text),
    text,
    transformPreview: undefined,
    validationIssues: [],
    workerBusy: false,
  };
}

/**
 * Reduces document editor actions into the next state.
 * @param state Current state.
 * @param action Dispatched action.
 * @returns Next state.
 */
export function documentReducer(
  state: DocumentState,
  action: DocumentAction,
): DocumentState {
  switch (action.type) {
    case "load": {
      const parsed = parser.parse(action.text);
      return {
        ...state,
        dirty: false,
        fileName: action.fileName,
        json: parsed.ok ? parsed.value : undefined,
        parseError: parsed.ok ? undefined : parsed.error,
        repairSuggestion: undefined,
        selection: [],
        sizeWarning: sizeWarningFor(action.text),
        text: action.text,
      };
    }
    case "setText": {
      const parsed = parser.parse(action.text);
      return {
        ...state,
        dirty: true,
        json: parsed.ok ? parsed.value : undefined,
        parseError: parsed.ok ? undefined : parsed.error,
        repairSuggestion: undefined,
        sizeWarning: sizeWarningFor(action.text),
        text: action.text,
      };
    }
    case "setJson":
      return {
        ...state,
        dirty: true,
        json: action.json,
        parseError: undefined,
        repairSuggestion: undefined,
        sizeWarning: sizeWarningFor(action.text),
        text: action.text,
      };
    case "setMode":
      return { ...state, mode: action.mode };
    case "setSelection":
      return { ...state, selection: action.path };
    case "setParseError":
      return { ...state, parseError: action.error };
    case "setValidationIssues":
      return { ...state, validationIssues: action.issues };
    case "setSchemaText":
      return { ...state, schemaText: action.schemaText };
    case "setSidePanel":
      return { ...state, sidePanel: action.panel };
    case "setSizeWarning":
      return { ...state, sizeWarning: action.warning };
    case "setWorkerBusy":
      return { ...state, workerBusy: action.busy };
    case "setRepairSuggestion":
      return { ...state, repairSuggestion: action.text };
    case "setSearchQuery":
      return { ...state, searchQuery: action.query };
    case "setReplaceValue":
      return { ...state, replaceValue: action.value };
    case "setTransformPreview":
      return { ...state, transformPreview: action.preview };
    case "markSaved":
      return { ...state, dirty: false };
    case "restoreSnapshot": {
      const parsed = parser.parse(action.snapshot.text);
      return {
        ...state,
        dirty: true,
        json: parsed.ok ? parsed.value : action.snapshot.json,
        parseError: parsed.ok ? undefined : parsed.error,
        sizeWarning: sizeWarningFor(action.snapshot.text),
        text: action.snapshot.text,
      };
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/**
 * Returns a size warning message when the document is large.
 * @param text Document text.
 * @returns Warning string, or `undefined`.
 */
function sizeWarningFor(text: string): string | undefined {
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes >= HUGE_DOCUMENT_BYTES) {
    return `Very large document (${formatBytes(bytes)}). Prefer text mode; tree/table may be slow.`;
  }
  if (bytes >= LARGE_DOCUMENT_BYTES) {
    return `Large document (${formatBytes(bytes)}). Heavy work runs in a background worker.`;
  }
  return;
}

/**
 * Formats a byte count for display.
 * @param bytes Byte length.
 * @returns Human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import type {
  JsonPath,
  JsonValue,
  ParseError,
  ValidationIssue,
} from "@json-editor/core/types/json.types.js";

import type { EDITOR_MODES, SIDE_PANELS } from "../constants/app.constants.js";

/** Active editor presentation mode. */
export type EditorMode = (typeof EDITOR_MODES)[number];

/** Optional side panel. */
export type SidePanel = (typeof SIDE_PANELS)[number];

/** Snapshot stored in undo/redo history. */
export interface DocumentSnapshot {
  /** Parsed JSON value at the time of the snapshot, if valid. */
  readonly json: JsonValue | undefined;
  /** Document text at the time of the snapshot. */
  readonly text: string;
}

/** Full document editor state. */
export interface DocumentState {
  /** Whether the document differs from the last saved version. */
  readonly dirty: boolean;
  /** Opened file name when loaded from disk. */
  readonly fileName: string | undefined;
  /** Latest successfully parsed JSON value. */
  readonly json: JsonValue | undefined;
  /** Active editor presentation mode. */
  readonly mode: EditorMode;
  /** Latest parse failure, if the text is invalid. */
  readonly parseError: ParseError | undefined;
  /** Suggested repaired text from the repair worker job. */
  readonly repairSuggestion: string | undefined;
  /** Replace field value for text-mode search/replace. */
  readonly replaceValue: string;
  /** JSON Schema text used for validation. */
  readonly schemaText: string;
  /** Search or filter query string. */
  readonly searchQuery: string;
  /** Currently selected JSON path. */
  readonly selection: JsonPath;
  /** Active side panel, or `"none"`. */
  readonly sidePanel: SidePanel;
  /** Warning shown when the document exceeds size guidance. */
  readonly sizeWarning: string | undefined;
  /** Current document text. */
  readonly text: string;
  /** Latest transform preview text or error message. */
  readonly transformPreview: string | undefined;
  /** Issues from the last validation run. */
  readonly validationIssues: ValidationIssue[];
  /** Whether a worker or parse job is in progress. */
  readonly workerBusy: boolean;
}

/** Actions handled by the document reducer. */
export type DocumentAction =
  | { readonly type: "load"; readonly text: string; readonly fileName?: string }
  | { readonly type: "setText"; readonly text: string }
  | {
      readonly type: "setJson";
      readonly json: JsonValue;
      readonly text: string;
    }
  | { readonly type: "setMode"; readonly mode: EditorMode }
  | { readonly type: "setSelection"; readonly path: JsonPath }
  | { readonly type: "setParseError"; readonly error: ParseError | undefined }
  | {
      readonly type: "setValidationIssues";
      readonly issues: ValidationIssue[];
    }
  | { readonly type: "setSchemaText"; readonly schemaText: string }
  | { readonly type: "setSidePanel"; readonly panel: SidePanel }
  | { readonly type: "setSizeWarning"; readonly warning: string | undefined }
  | { readonly type: "setWorkerBusy"; readonly busy: boolean }
  | {
      readonly type: "setRepairSuggestion";
      readonly text: string | undefined;
    }
  | { readonly type: "setSearchQuery"; readonly query: string }
  | { readonly type: "setReplaceValue"; readonly value: string }
  | {
      readonly type: "setTransformPreview";
      readonly preview: string | undefined;
    }
  | { readonly type: "markSaved" }
  | { readonly type: "restoreSnapshot"; readonly snapshot: DocumentSnapshot }
  | {
      readonly type: "applyParseResult";
      readonly text: string;
      readonly json: JsonValue | undefined;
      readonly parseError: ParseError | undefined;
    };

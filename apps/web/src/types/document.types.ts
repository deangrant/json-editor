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
  readonly json: JsonValue | undefined;
  readonly text: string;
}

/** Full document editor state. */
export interface DocumentState {
  readonly dirty: boolean;
  readonly fileName: string | undefined;
  readonly json: JsonValue | undefined;
  readonly mode: EditorMode;
  readonly parseError: ParseError | undefined;
  readonly repairSuggestion: string | undefined;
  readonly replaceValue: string;
  readonly schemaText: string;
  readonly searchQuery: string;
  readonly selection: JsonPath;
  readonly sidePanel: SidePanel;
  readonly sizeWarning: string | undefined;
  readonly text: string;
  readonly transformPreview: string | undefined;
  readonly validationIssues: ValidationIssue[];
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

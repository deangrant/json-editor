import type { TransformProgram } from "@json-editor/core/query/transform.types.js";
import type {
  JsonPath,
  JsonValue,
} from "@json-editor/core/types/json.types.js";

import type {
  DocumentState,
  EditorMode,
  SidePanel,
} from "../types/document.types.js";

/** Document state reads and structural/text mutations. */
export interface DocumentStateApi {
  /** Replaces the parsed JSON value and derived text. */
  setJson: (json: JsonValue) => void;
  /** Switches the active editor presentation mode. */
  setMode: (mode: EditorMode) => void;
  /** Updates the selected JSON path. */
  setSelection: (path: JsonPath) => void;
  /** Opens or closes a side panel. */
  setSidePanel: (panel: SidePanel) => void;
  /** Replaces document text and schedules parse. */
  setText: (text: string) => void;
  /** Current document editor state. */
  readonly state: DocumentState;
}

/** Undo/redo capabilities for document snapshots. */
export interface DocumentHistoryApi {
  /** Whether redo is available. */
  readonly canRedo: boolean;
  /** Whether undo is available. */
  readonly canUndo: boolean;
  /** Reapplies the next undone snapshot. */
  redo: () => void;
  /** Restores the previous snapshot. */
  undo: () => void;
}

/** Local file open/save operations. */
export interface DocumentFileApi {
  /** Opens a JSON file from disk. */
  openFile: () => Promise<void>;
  /** Saves the current document text. */
  saveFile: () => void;
}

/** Format, compact, and repair operations. */
export interface DocumentFormatApi {
  /** Applies the current repair suggestion as document text. */
  acceptRepair: () => void;
  /** Compacts the parsed document. */
  compact: () => Promise<void>;
  /** Pretty-prints the parsed document. */
  format: () => Promise<void>;
  /** Requests a repair suggestion for invalid JSON. */
  repair: () => Promise<void>;
}

/** Schema text and validation operations. */
export interface DocumentSchemaApi {
  /** Updates the JSON Schema text used for validation. */
  setSchemaText: (schemaText: string) => void;
  /** Runs schema and custom validators against the parsed document. */
  validate: () => Promise<void>;
}

/** Transform preview and apply operations. */
export interface DocumentTransformApi {
  /** Applies a transform program to the document. */
  applyTransform: (program: TransformProgram) => Promise<void>;
  /** Previews a transform program without writing back. */
  previewTransform: (program: TransformProgram) => Promise<void>;
}

/** Search and replace operations for text mode. */
export interface DocumentSearchApi {
  /** Replaces the first or all occurrences of `query` in document text. */
  replaceInText: (query: string, replacement: string, all: boolean) => void;
  /** Updates the replace field value. */
  setReplaceValue: (value: string) => void;
  /** Updates the search/filter query. */
  setSearchQuery: (query: string) => void;
}

/** Full document context API composed from role interfaces. */
export type DocumentContextValue = DocumentStateApi &
  DocumentHistoryApi &
  DocumentFileApi &
  DocumentFormatApi &
  DocumentSchemaApi &
  DocumentTransformApi &
  DocumentSearchApi;

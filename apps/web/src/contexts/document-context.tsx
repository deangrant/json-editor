import type { TransformProgram } from "@json-editor/core/query/transform.types.js";
import type {
  JsonPath,
  JsonValue,
} from "@json-editor/core/types/json.types.js";
import { createContext, type ReactNode, useContext } from "react";

import { useDocumentController } from "../hooks/use-document-controller.js";
import type {
  DocumentState,
  EditorMode,
  SidePanel,
} from "../types/document.types.js";

/** Document context API exposed to the editor UI. */
export interface DocumentContextValue {
  acceptRepair: () => void;
  applyTransform: (program: TransformProgram) => Promise<void>;
  readonly canRedo: boolean;
  readonly canUndo: boolean;
  compact: () => Promise<void>;
  format: () => Promise<void>;
  openFile: () => Promise<void>;
  previewTransform: (program: TransformProgram) => Promise<void>;
  redo: () => void;
  repair: () => Promise<void>;
  replaceInText: (query: string, replacement: string, all: boolean) => void;
  saveFile: () => void;
  setJson: (json: JsonValue) => void;
  setMode: (mode: EditorMode) => void;
  setReplaceValue: (value: string) => void;
  setSchemaText: (schemaText: string) => void;
  setSearchQuery: (query: string) => void;
  setSelection: (path: JsonPath) => void;
  setSidePanel: (panel: SidePanel) => void;
  setText: (text: string) => void;
  readonly state: DocumentState;
  undo: () => void;
  validate: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(
  undefined,
);

/**
 * Provides document state and editor operations to descendants.
 * @param props Provider props.
 * @returns Context provider element.
 */
export function DocumentProvider({ children }: { children: ReactNode }) {
  const value = useDocumentController();
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

/**
 * Reads the document context.
 * @returns Document context value.
 */
export function useDocumentContext(): DocumentContextValue {
  const value = useContext(DocumentContext);
  if (!value) {
    throw new Error("useDocumentContext must be used within DocumentProvider.");
  }
  return value;
}

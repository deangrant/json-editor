import { createContext, type ReactNode, useContext } from "react";

import { useDocumentController } from "../hooks/use-document-controller.js";
import type { DocumentContextValue } from "./document-context.types.js";

export type {
  DocumentContextValue,
  DocumentFileApi,
  DocumentFormatApi,
  DocumentHistoryApi,
  DocumentSchemaApi,
  DocumentSearchApi,
  DocumentStateApi,
  DocumentTransformApi,
} from "./document-context.types.js";

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
 * Reads the full document context.
 * @returns Document context value.
 */
export function useDocumentContext(): DocumentContextValue {
  const value = useContext(DocumentContext);
  if (!value) {
    throw new Error("useDocumentContext must be used within DocumentProvider.");
  }
  return value;
}

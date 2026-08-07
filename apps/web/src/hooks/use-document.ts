import { useDocumentContext } from "../contexts/document-context.js";

/**
 * Accesses the document editor API.
 * @returns Document context value.
 */
export function useDocument() {
  return useDocumentContext();
}

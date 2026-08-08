import {
  type DocumentContextValue,
  type DocumentFileApi,
  type DocumentFormatApi,
  type DocumentHistoryApi,
  type DocumentSchemaApi,
  type DocumentSearchApi,
  type DocumentStateApi,
  type DocumentTransformApi,
  useDocumentContext,
} from "../contexts/document-context.js";

/**
 * Accesses the full document editor API.
 * @returns Document context value.
 */
export function useDocument(): DocumentContextValue {
  return useDocumentContext();
}

/**
 * Accesses document state and structural/text mutations.
 * @returns State role API.
 */
export function useDocumentState(): DocumentStateApi {
  const { setJson, setMode, setSelection, setSidePanel, setText, state } =
    useDocumentContext();
  return { setJson, setMode, setSelection, setSidePanel, setText, state };
}

/**
 * Accesses undo/redo operations.
 * @returns History role API.
 */
export function useDocumentHistory(): DocumentHistoryApi {
  const { canRedo, canUndo, redo, undo } = useDocumentContext();
  return { canRedo, canUndo, redo, undo };
}

/**
 * Accesses local file open/save operations.
 * @returns File role API.
 */
export function useDocumentFile(): DocumentFileApi {
  const { openFile, saveFile } = useDocumentContext();
  return { openFile, saveFile };
}

/**
 * Accesses format, compact, and repair operations.
 * @returns Format role API.
 */
export function useDocumentFormat(): DocumentFormatApi {
  const { acceptRepair, compact, format, repair } = useDocumentContext();
  return { acceptRepair, compact, format, repair };
}

/**
 * Accesses schema text and validation operations.
 * @returns Schema role API.
 */
export function useDocumentSchema(): DocumentSchemaApi {
  const { setSchemaText, validate } = useDocumentContext();
  return { setSchemaText, validate };
}

/**
 * Accesses transform preview and apply operations.
 * @returns Transform role API.
 */
export function useDocumentTransform(): DocumentTransformApi {
  const { applyTransform, previewTransform } = useDocumentContext();
  return { applyTransform, previewTransform };
}

/**
 * Accesses search and replace operations.
 * @returns Search role API.
 */
export function useDocumentSearch(): DocumentSearchApi {
  const { replaceInText, setReplaceValue, setSearchQuery } =
    useDocumentContext();
  return { replaceInText, setReplaceValue, setSearchQuery };
}

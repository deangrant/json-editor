/**
 * Returns whether the CodeMirror document should be replaced from app state.
 * @param current Editor document text.
 * @param next Document controller text.
 * @returns True when the editor is out of sync.
 */
export function needsExternalDocumentReplace(
  current: string,
  next: string,
): boolean {
  return current !== next;
}

/**
 * Builds a full-document replace change for CodeMirror.
 * @param currentLength Current document length.
 * @param next Replacement text.
 * @returns CodeMirror changes spec.
 */
export function fullDocumentReplaceSpec(
  currentLength: number,
  next: string,
): { from: number; to: number; insert: string } {
  return { from: 0, insert: next, to: currentLength };
}

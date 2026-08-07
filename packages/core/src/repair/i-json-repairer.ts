/** Result of attempting to repair invalid JSON text. */
export type RepairResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly message: string };

/**
 * Repairs invalid JSON text into a parseable form when possible.
 */
export interface IJsonRepairer {
  /**
   * Attempts to repair `text`.
   * @param text Possibly invalid JSON text.
   * @returns Repaired text, or a failure message.
   */
  repair(text: string): RepairResult;
}

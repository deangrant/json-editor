/** Result of resolving a table cell blur. */
export type TableCellBlurResult =
  | { readonly action: "discard" }
  | { readonly action: "commit"; readonly text: string };

/**
 * Resolves whether a table cell blur should discard or commit a draft.
 * @param options Skip-commit flag, draft text, and last committed display text.
 * @returns Discard or commit with the text to apply.
 */
export function resolveTableCellBlur(options: {
  readonly skipCommit: boolean;
  readonly draft: string | undefined;
  readonly committed: string;
}): TableCellBlurResult {
  if (options.skipCommit) {
    return { action: "discard" };
  }
  return {
    action: "commit",
    text: options.draft ?? options.committed,
  };
}

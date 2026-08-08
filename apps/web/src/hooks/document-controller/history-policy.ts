/** Decision for how a document history write should be recorded. */
export type HistoryWriteDecision = "skip" | "replace" | "push";

/**
 * Decides whether a history snapshot should be skipped, replace the present,
 * or push a new undo step.
 * @param options Current/next text, coalesce timing, and force flag.
 * @returns History write decision.
 */
export function decideHistoryWrite(options: {
  readonly currentText: string | undefined;
  readonly nextText: string;
  readonly lastPushAt: number;
  readonly now: number;
  readonly coalesceMs: number;
  readonly force: boolean;
}): HistoryWriteDecision {
  const { currentText, nextText, lastPushAt, now, coalesceMs, force } = options;
  if (currentText === nextText) {
    return "skip";
  }
  if (!force && currentText !== undefined && now - lastPushAt < coalesceMs) {
    return "replace";
  }
  return "push";
}

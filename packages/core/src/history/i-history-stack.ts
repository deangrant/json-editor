/**
 * Undo/redo stack for document snapshots.
 * @typeParam T Snapshot type stored in the stack.
 */
export interface IHistoryStack<T> {
  /** Whether a redo operation is available. */
  canRedo: () => boolean;
  /** Whether an undo operation is available. */
  canUndo: () => boolean;

  /** Clears all history. */
  clear: () => void;

  /** Current snapshot, if any. */
  current: () => T | undefined;

  /**
   * Records a new snapshot and clears the redo branch.
   * @param snapshot Document snapshot to store.
   */
  push: (snapshot: T) => void;

  /**
   * Moves one step forward.
   * @returns Next snapshot, or `undefined` if none.
   */
  redo: () => T | undefined;

  /**
   * Replaces the current snapshot without affecting undo/redo branches.
   * @param snapshot Document snapshot to store as present.
   */
  replacePresent: (snapshot: T) => void;

  /**
   * Moves one step backward.
   * @returns Previous snapshot, or `undefined` if none.
   */
  undo: () => T | undefined;
}

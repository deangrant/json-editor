/**
 * Undo/redo stack for document snapshots.
 * @typeparam T Snapshot type stored in the stack.
 */
export interface IHistoryStack<T> {
  /**
   * Returns whether a redo operation is available.
   * @returns True when at least one redo snapshot exists.
   */
  canRedo: () => boolean;

  /**
   * Returns whether an undo operation is available.
   * @returns True when at least one undo snapshot exists.
   */
  canUndo: () => boolean;

  /** Clears all history. */
  clear: () => void;

  /**
   * Returns the current snapshot, if any.
   * @returns Present snapshot, or `undefined` when empty.
   */
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

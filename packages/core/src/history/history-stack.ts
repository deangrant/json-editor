import type { IHistoryStack } from "./i-history-stack.js";

/**
 * In-memory undo/redo stack with a maximum depth.
 * @typeParam T Snapshot type stored in the stack.
 */
export class HistoryStack<T> implements IHistoryStack<T> {
  private past: T[] = [];
  private present: T | undefined;
  private future: T[] = [];
  private readonly maxDepth: number;

  /**
   * @param maxDepth Maximum number of past and future entries retained.
   */
  constructor(maxDepth = 100) {
    this.maxDepth = maxDepth;
  }

  /** @inheritdoc */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /** @inheritdoc */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Records a new snapshot and clears the redo branch.
   * @param snapshot Document snapshot to store.
   */
  push(snapshot: T): void {
    if (this.present !== undefined) {
      this.past.push(this.present);
      this.trimPast();
    }
    this.present = snapshot;
    this.future = [];
  }

  /**
   * Replaces the current snapshot without affecting undo/redo branches.
   * @param snapshot Document snapshot to store as present.
   */
  replacePresent(snapshot: T): void {
    this.present = snapshot;
  }

  /**
   * Moves one step backward.
   * @returns Previous snapshot, or `undefined` if none.
   */
  undo(): T | undefined {
    if (this.present === undefined || this.past.length === 0) {
      return;
    }
    this.future.unshift(this.present);
    this.trimFuture();
    this.present = this.past.pop();
    return this.present;
  }

  /**
   * Moves one step forward.
   * @returns Next snapshot, or `undefined` if none.
   */
  redo(): T | undefined {
    if (this.future.length === 0) {
      return;
    }
    if (this.present !== undefined) {
      this.past.push(this.present);
      this.trimPast();
    }
    this.present = this.future.shift();
    return this.present;
  }

  /** Current snapshot, if any. */
  current(): T | undefined {
    return this.present;
  }

  /** Clears all history. */
  clear(): void {
    this.past = [];
    this.present = undefined;
    this.future = [];
  }

  /** Drops oldest past entries when over max depth. */
  private trimPast(): void {
    while (this.past.length > this.maxDepth) {
      this.past.shift();
    }
  }

  /** Drops farthest future entries when over max depth. */
  private trimFuture(): void {
    while (this.future.length > this.maxDepth) {
      this.future.pop();
    }
  }
}

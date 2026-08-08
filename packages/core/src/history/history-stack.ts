import type { IHistoryStack } from "./i-history-stack.js";

/**
 * In-memory undo/redo stack with a maximum depth.
 * @typeparam T Snapshot type stored in the stack.
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

  /**
   * Returns whether an undo operation is available.
   * @returns True when at least one undo snapshot exists.
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Returns whether a redo operation is available.
   * @returns True when at least one redo snapshot exists.
   */
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

  /**
   * Returns the current snapshot, if any.
   * @returns Present snapshot, or `undefined` when empty.
   */
  current(): T | undefined {
    return this.present;
  }

  /** Clears all past, present, and future snapshots. */
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

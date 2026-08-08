import { describe, expect, it } from "vitest";

import { HistoryStack } from "./history-stack.js";

describe("HistoryStack", () => {
  it("supports undo and redo", () => {
    const stack = new HistoryStack<string>();
    stack.push("a");
    stack.push("b");
    stack.push("c");

    expect(stack.undo()).toBe("b");
    expect(stack.undo()).toBe("a");
    expect(stack.canUndo()).toBe(false);
    expect(stack.redo()).toBe("b");
    expect(stack.current()).toBe("b");
  });

  it("clears the redo branch on push", () => {
    const stack = new HistoryStack<string>();
    stack.push("a");
    stack.push("b");
    stack.undo();
    stack.push("c");
    expect(stack.canRedo()).toBe(false);
    expect(stack.current()).toBe("c");
  });

  it("replacePresent updates current without creating an undo step", () => {
    const stack = new HistoryStack<string>();
    stack.push("a");
    stack.push("b");
    stack.replacePresent("b2");

    expect(stack.current()).toBe("b2");
    expect(stack.undo()).toBe("a");
    expect(stack.canUndo()).toBe(false);
  });

  it("keeps undo depth within maxDepth after redo cycles", () => {
    const stack = new HistoryStack<string>(2);
    for (const value of ["a", "b", "c", "d", "e"]) {
      stack.push(value);
    }

    while (stack.canUndo()) {
      stack.undo();
    }
    while (stack.canRedo()) {
      stack.redo();
    }

    let undoCount = 0;
    while (stack.canUndo()) {
      stack.undo();
      undoCount += 1;
    }
    expect(undoCount).toBeLessThanOrEqual(2);
  });

  it("caps future length at maxDepth across undo", () => {
    const stack = new HistoryStack<string>(2);
    stack.push("a");
    stack.push("b");
    stack.push("c");
    stack.undo();
    stack.undo();

    let redoCount = 0;
    while (stack.canRedo()) {
      stack.redo();
      redoCount += 1;
    }
    expect(redoCount).toBeLessThanOrEqual(2);
  });
});

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
});

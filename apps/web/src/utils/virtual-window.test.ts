import { describe, expect, it } from "vitest";

import { getVirtualWindow } from "./virtual-window.js";

describe("getVirtualWindow", () => {
  it("returns an empty window for zero items or invalid height", () => {
    expect(getVirtualWindow(0, 100, 0, 20)).toEqual({
      end: 0,
      offsetY: 0,
      start: 0,
    });
    expect(getVirtualWindow(40, 100, 10, 0)).toEqual({
      end: 0,
      offsetY: 0,
      start: 0,
    });
  });

  it("computes the top window with default overscan", () => {
    const window = getVirtualWindow(0, 100, 100, 20);
    expect(window.start).toBe(0);
    expect(window.offsetY).toBe(0);
    // visible = ceil(100/20) + 8*2 = 5 + 16 = 21
    expect(window.end).toBe(21);
  });

  it("clamps the end index to itemCount", () => {
    const window = getVirtualWindow(360, 100, 30, 20);
    expect(window.start).toBe(10);
    expect(window.end).toBe(30);
    expect(window.offsetY).toBe(200);
  });

  it("shrinks the window when overscan is reduced", () => {
    const wide = getVirtualWindow(200, 100, 100, 20, 8);
    const narrow = getVirtualWindow(200, 100, 100, 20, 1);
    expect(narrow.end - narrow.start).toBeLessThan(wide.end - wide.start);
    expect(narrow.start).toBeGreaterThan(wide.start);
  });
});

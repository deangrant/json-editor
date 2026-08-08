import { describe, expect, it } from "vitest";

import { decideHistoryWrite } from "./history-policy.js";

describe("decideHistoryWrite", () => {
  it("skips when text is unchanged", () => {
    expect(
      decideHistoryWrite({
        coalesceMs: 500,
        currentText: '{"a":1}',
        force: false,
        lastPushAt: 0,
        nextText: '{"a":1}',
        now: 1000,
      }),
    ).toBe("skip");
  });

  it("replaces within the coalesce window", () => {
    expect(
      decideHistoryWrite({
        coalesceMs: 500,
        currentText: '{"a":1}',
        force: false,
        lastPushAt: 1000,
        nextText: '{"a":2}',
        now: 1200,
      }),
    ).toBe("replace");
  });

  it("pushes after the coalesce window", () => {
    expect(
      decideHistoryWrite({
        coalesceMs: 500,
        currentText: '{"a":1}',
        force: false,
        lastPushAt: 1000,
        nextText: '{"a":2}',
        now: 1600,
      }),
    ).toBe("push");
  });

  it("pushes when force is set even inside the coalesce window", () => {
    expect(
      decideHistoryWrite({
        coalesceMs: 500,
        currentText: '{"a":1}',
        force: true,
        lastPushAt: 1000,
        nextText: '{"a":2}',
        now: 1100,
      }),
    ).toBe("push");
  });

  it("pushes when there is no current text", () => {
    expect(
      decideHistoryWrite({
        coalesceMs: 500,
        currentText: undefined,
        force: false,
        lastPushAt: 0,
        nextText: "{}",
        now: 100,
      }),
    ).toBe("push");
  });
});

import { describe, expect, it } from "vitest";

import { resolveTableCellBlur } from "./table-cell-edit.js";

describe("resolveTableCellBlur", () => {
  it("discards when skipCommit is set", () => {
    expect(
      resolveTableCellBlur({
        committed: "1",
        draft: "2",
        skipCommit: true,
      }),
    ).toEqual({ action: "discard" });
  });

  it("commits the draft text", () => {
    expect(
      resolveTableCellBlur({
        committed: "1",
        draft: "2",
        skipCommit: false,
      }),
    ).toEqual({ action: "commit", text: "2" });
  });

  it("falls back to committed when draft is undefined", () => {
    expect(
      resolveTableCellBlur({
        committed: "1",
        draft: undefined,
        skipCommit: false,
      }),
    ).toEqual({ action: "commit", text: "1" });
  });
});

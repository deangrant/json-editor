import { describe, expect, it } from "vitest";

import { DEFAULT_DOCUMENT } from "../constants/app.constants.js";
import { createInitialState, documentReducer } from "./document-reducer.js";

describe("createInitialState", () => {
  it("seeds a clean tree-mode document from the default sample", () => {
    const state = createInitialState();
    expect(state.dirty).toBe(false);
    expect(state.mode).toBe("tree");
    expect(state.json).toEqual(DEFAULT_DOCUMENT);
    expect(state.parseError).toBeUndefined();
    expect(state.fileName).toBeUndefined();
    expect(state.text.length).toBeGreaterThan(0);
    expect(state.sizeWarning).toBeUndefined();
  });
});

describe("documentReducer", () => {
  it("loads text as clean and clears parse-related fields", () => {
    const dirty = documentReducer(createInitialState(), {
      json: { x: 1 },
      text: '{"x":1}',
      type: "setJson",
    });
    const loaded = documentReducer(dirty, {
      fileName: "doc.json",
      text: '{"ok":true}',
      type: "load",
    });
    expect(loaded.dirty).toBe(false);
    expect(loaded.fileName).toBe("doc.json");
    expect(loaded.text).toBe('{"ok":true}');
    expect(loaded.json).toBeUndefined();
    expect(loaded.parseError).toBeUndefined();
    expect(loaded.repairSuggestion).toBeUndefined();
    expect(loaded.selection).toEqual([]);
  });

  it("marks setText dirty and clears json until parse applies", () => {
    const next = documentReducer(createInitialState(), {
      text: "{",
      type: "setText",
    });
    expect(next.dirty).toBe(true);
    expect(next.text).toBe("{");
    expect(next.json).toBeUndefined();
    expect(next.parseError).toBeUndefined();
    expect(next.repairSuggestion).toBeUndefined();
  });

  it("ignores stale applyParseResult when text no longer matches", () => {
    const state = documentReducer(createInitialState(), {
      text: '{"a":1}',
      type: "setText",
    });
    const unchanged = documentReducer(state, {
      json: { a: 1 },
      parseError: undefined,
      text: '{"a":2}',
      type: "applyParseResult",
    });
    expect(unchanged).toBe(state);

    const applied = documentReducer(state, {
      json: { a: 1 },
      parseError: undefined,
      text: '{"a":1}',
      type: "applyParseResult",
    });
    expect(applied.json).toEqual({ a: 1 });
    expect(applied.parseError).toBeUndefined();
    expect(applied.text).toBe('{"a":1}');
  });

  it("restores snapshots as dirty and clears dirty on markSaved", () => {
    const restored = documentReducer(createInitialState(), {
      snapshot: { json: { z: 9 }, text: '{"z":9}' },
      type: "restoreSnapshot",
    });
    expect(restored.dirty).toBe(true);
    expect(restored.json).toEqual({ z: 9 });
    expect(restored.text).toBe('{"z":9}');
    expect(restored.parseError).toBeUndefined();

    const saved = documentReducer(restored, { type: "markSaved" });
    expect(saved.dirty).toBe(false);
    expect(saved.text).toBe(restored.text);
  });

  it("setJson updates json and text and clears parse/repair fields", () => {
    const withNoise = {
      ...createInitialState(),
      parseError: { message: "bad" },
      repairSuggestion: "{fixed}",
    };
    const next = documentReducer(withNoise, {
      json: { ok: true },
      text: '{"ok":true}',
      type: "setJson",
    });
    expect(next.dirty).toBe(true);
    expect(next.json).toEqual({ ok: true });
    expect(next.text).toBe('{"ok":true}');
    expect(next.parseError).toBeUndefined();
    expect(next.repairSuggestion).toBeUndefined();
  });
});

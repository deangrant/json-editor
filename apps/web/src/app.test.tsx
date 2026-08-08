import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";

describe("App", () => {
  it("renders stable editor chrome", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('aria-label="Editor mode"');
    expect(html).toContain("Open");
    expect(html).toContain("Save");
    expect(html).toContain("Undo");
  });

  it("loads the json worker module graph", async () => {
    const previousSelf = (globalThis as { self?: unknown }).self;
    (globalThis as { self: typeof globalThis }).self = globalThis;
    try {
      await expect(import("./workers/json-worker.js")).resolves.toBeDefined();
    } finally {
      if (previousSelf === undefined) {
        Reflect.deleteProperty(globalThis, "self");
      } else {
        (globalThis as { self: unknown }).self = previousSelf;
      }
    }
  });
});

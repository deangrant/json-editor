import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";

describe("App", () => {
  it("renders the editor chrome", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Editor mode");
    expect(html).toContain("Open");
  });
});

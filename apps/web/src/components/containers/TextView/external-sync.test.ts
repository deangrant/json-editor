import { describe, expect, it } from "vitest";

import {
  fullDocumentReplaceSpec,
  needsExternalDocumentReplace,
} from "./external-sync.js";

describe("external-sync", () => {
  it("does not replace when texts are equal", () => {
    expect(needsExternalDocumentReplace('{"a":1}', '{"a":1}')).toBe(false);
  });

  it("replaces when texts differ", () => {
    expect(needsExternalDocumentReplace('{"a":1}', '{"a":2}')).toBe(true);
  });

  it("builds a full-document replace spec", () => {
    expect(fullDocumentReplaceSpec(7, '{"b":2}')).toEqual({
      from: 0,
      insert: '{"b":2}',
      to: 7,
    });
  });
});

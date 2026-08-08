import { describe, expect, it } from "vitest";

import {
  outcomeFromLocalParse,
  outcomeFromWorkerParseResponse,
} from "./parse-outcomes.js";

describe("parse-outcomes", () => {
  it("maps a successful worker parse response", () => {
    expect(
      outcomeFromWorkerParseResponse({
        id: "job-1",
        ok: true,
        result: { type: "parse", value: { a: 1 } },
      }),
    ).toEqual({ json: { a: 1 }, parseError: undefined });
  });

  it("maps a failed worker parse response", () => {
    const parseError = {
      message: "Unexpected token",
      position: 1,
    };
    expect(
      outcomeFromWorkerParseResponse({
        error: "parse failed",
        id: "job-2",
        ok: false,
        parseError,
      }),
    ).toEqual({ json: undefined, parseError });
  });

  it("maps an unexpected successful worker response type", () => {
    expect(
      outcomeFromWorkerParseResponse({
        id: "job-3",
        ok: true,
        result: { issues: [], type: "validate" },
      }),
    ).toEqual({ json: undefined, parseError: undefined });
  });

  it("maps a successful local parse", () => {
    expect(outcomeFromLocalParse('{"ok":true}')).toEqual({
      json: { ok: true },
      parseError: undefined,
    });
  });

  it("maps a failed local parse", () => {
    const outcome = outcomeFromLocalParse("{");
    expect(outcome.json).toBeUndefined();
    const { parseError } = outcome;
    if (!parseError) {
      throw new Error("expected parseError");
    }
    expect(parseError.message.length).toBeGreaterThan(0);
  });
});

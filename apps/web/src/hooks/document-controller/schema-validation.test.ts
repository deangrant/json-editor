import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import { describe, expect, it, vi } from "vitest";

import type { WorkerPort } from "./deps.js";
import { collectSchemaIssues } from "./schema-validation.js";

const parser = new JsonParser();

describe("collectSchemaIssues", () => {
  it("returns no issues for empty schema text", async () => {
    await expect(
      collectSchemaIssues({}, "", parser, undefined),
    ).resolves.toEqual({
      issues: [],
      kind: "issues",
    });
  });

  it("rejects oversized schema text", async () => {
    const schemaText = `"${"x".repeat(256 * 1024)}"`;
    const result = await collectSchemaIssues({}, schemaText, parser, undefined);
    expect(result.kind).toBe("invalidSchema");
    expect(result.issues[0]?.message).toContain("too large");
  });

  it("rejects invalid JSON schema text", async () => {
    const result = await collectSchemaIssues({}, "{", parser, undefined);
    expect(result.kind).toBe("invalidSchema");
    expect(result.issues[0]?.message).toContain("not valid JSON");
  });

  it("maps worker failure to a schema issue", async () => {
    const worker = {
      dispose: vi.fn(),
      run: vi.fn().mockResolvedValue({
        error: "boom",
        id: "job-1",
        ok: false,
      }),
    } satisfies WorkerPort;

    const result = await collectSchemaIssues(
      {},
      '{"type":"object"}',
      parser,
      worker,
    );
    expect(result.kind).toBe("issues");
    expect(result.issues).toEqual([
      {
        message: "Schema validation failed: boom",
        path: [],
        severity: "error",
        source: "schema",
      },
    ]);
  });

  it("passes through worker validation issues", async () => {
    const issues = [
      {
        message: "$.name: must be string",
        path: ["name"],
        severity: "error" as const,
        source: "schema",
      },
    ];
    const worker = {
      dispose: vi.fn(),
      run: vi.fn().mockResolvedValue({
        id: "job-2",
        ok: true,
        result: { issues, type: "validate" },
      }),
    } satisfies WorkerPort;

    const result = await collectSchemaIssues(
      { name: 1 },
      '{"type":"object"}',
      parser,
      worker,
    );
    expect(result).toEqual({ issues, kind: "issues" });
  });
});

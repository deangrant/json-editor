---
name: vitest-web-testing
description: >-
  Write Vitest unit tests for apps/web and packages/core. Prefer colocated
  *.test.ts(x), pure helper extracts over RTL/CodeMirror mounts, node env by
  default, happy-dom only for DOM APIs, and Fake Worker for WorkerClient.
---

# Vitest web testing

**Announce at use:** "I'm following the vitest-web-testing skill."

## Defaults

- Colocate tests as `*.test.ts` / `*.test.tsx` next to the module under test.
- Prefer **pure extracts** (policy helpers, reducers, sync functions) over
  mounting React or CodeMirror. Do **not** add `@testing-library/react` unless
  the user asks.
- Default Vitest environment is `node` (`apps/web/vitest.config.ts`). Add
  `// @vitest-environment happy-dom` only when the unit needs DOM APIs
  (e.g. `file-io` / `FileReader`).
- For `WorkerClient`, install a fake `Worker` on `globalThis` in the test file
  (see [reference.md](reference.md)). Do not spin a real worker in unit tests.

## Where to put tests

| Logic lives in… | Prefer tests in… |
| --- | --- |
| Pure domain (parse, format, repair, validate, transform, history, path) | `packages/core` next to the module |
| Web-only adapters (file I/O, worker client, UI helpers, controller policies) | `apps/web` colocated `*.test.ts(x)` |
| Shared policy extracted from a hook/component | Same package as the extract (`history-policy.ts`, `external-sync.ts`, etc.) |

If the behavior is domain and framework-free, put it in `packages/core` and test
there. Keep React/browser wiring tests in `apps/web`.

## Workflow

1. Identify the pure surface (or extract one if the unit is tangled with React).
2. Write failing colocated tests.
3. Implement / fix until green (`pnpm test` from root, or package filter).
4. Avoid snapshot-heavy UI and full editor mounts unless explicitly requested.

## See also

- [reference.md](reference.md) — env pragma, Fake Worker sketch, package split
- Project conventions: `.agents/rules/json-editor-conventions.mdc`

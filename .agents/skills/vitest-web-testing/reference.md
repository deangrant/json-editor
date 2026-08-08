# Vitest web testing — reference

## Environments

| Need | Approach |
| --- | --- |
| Pure functions, reducers, protocol types | Default `node` (no pragma) |
| `File`, `FileReader`, `Blob`, DOM constructors | First line: `// @vitest-environment happy-dom` |
| `Worker` messaging | Fake `Worker` class; assign to `globalThis.Worker` in `beforeEach` |

Do not switch the whole web package to `happy-dom` for one file.

## Fake Worker (WorkerClient)

Pattern used in `apps/web/src/services/worker-client.test.ts`:

1. Define a `FakeWorker` with `addEventListener`, `postMessage`, `terminate`.
2. On `postMessage`, `queueMicrotask` and emit a matching `message` event.
3. In `beforeEach`, set `globalThis.Worker = FakeWorker as unknown as typeof Worker`.
4. Clear instances / restore in `afterEach`.

Keep responses typed as `WorkerResponse` from `@json-editor/core/worker/protocol.js`.

## Core vs web

- **Extend `packages/core` tests** when asserting parse/repair/validate/format/
  transform/history/path behavior with no browser APIs.
- **Extend `apps/web` tests** for `WorkerClient`, `file-io`, document-controller
  policies, store reducers, and UI-adjacent pure helpers.
- App smoke (`app.test.tsx`) stays minimal; do not grow it into an RTL suite.

## Commands

```bash
pnpm test
pnpm --filter @json-editor/web test
pnpm --filter @json-editor/core test
```

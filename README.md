# JSON Editor

Browser-based JSON editor for viewing, editing, formatting, repairing,
transforming, and validating JSON documents.

## Packages

| Path | Name | Role |
| --- | --- | --- |
| `apps/web` | `@json-editor/web` | React UI (tree, text, table modes) |
| `packages/core` | `@json-editor/core` | Parse, format, repair, validate, transform, history |

## Requirements

- Node.js `>=22`
- pnpm `11.8.0` (pinned via `packageManager`)

```bash
corepack enable
pnpm install
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the web app |
| `pnpm build` | Build workspace packages |
| `pnpm test` | Run unit tests |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm check` | Biome check (format + lint) |

## Features

- Tree, text (CodeMirror), and table views
- Format / compact, undo / redo, search / replace
- JSON repair for invalid documents
- JSON Schema validation (Ajv) plus pluggable custom rules
- Built-in transform DSL: filter, sort, pick, limit
- Color picker and timestamp helpers
- Web Worker offload for heavy parse/repair/validate/format/transform work

## License

MIT — see [LICENSE](./LICENSE).

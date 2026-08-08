# JSON Editor

Browser SPA for viewing, editing, formatting, repairing, transforming, and
validating JSON. There is no backend — open and save use the browser file APIs.

## Features

- Tree, text (CodeMirror), and table editor modes
- Format / compact, undo / redo, search / replace
- Open and save local JSON files
- JSON repair for invalid documents
- JSON Schema validation (Ajv) plus pluggable custom rules
- Schema and transform side panels
- Transform DSL: filter, sort, pick, map, limit
- Color picker and timestamp helpers in the tree
- Web Worker offload for parse / repair / format / validate / transform
- Status bar with worker busy state and large-document warnings

## Packages

| Path | Name | Role |
| --- | --- | --- |
| `apps/web` | `@json-editor/web` | React UI, worker host, file I/O, document controller |
| `packages/core` | `@json-editor/core` | Parse, format, repair, validate, transform, path, history, worker types |

Both packages are private workspace members (not published to npm).

## Stack

- React 19 + Vite
- CodeMirror 6 (text mode)
- Ajv + jsonrepair
- Vitest + Biome
- pnpm workspace with a shared dependency catalog

Pinned versions live in [`package.json`](package.json) (`packageManager`) and
[`pnpm-workspace.yaml`](pnpm-workspace.yaml) (`catalog:`).

## Requirements

- Node.js `>=22`
- pnpm `11.8.0` (pinned via `packageManager`)

```bash
corepack enable
pnpm install
pnpm dev
```

The web app listens on [http://localhost:5173](http://localhost:5173) by default.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the web app |
| `pnpm build` | Build workspace packages |
| `pnpm test` | Run unit tests |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm check` | Biome check (format + lint) |
| `pnpm verify` | Pre-merge: Biome CI, typecheck, tests, lockfile, audit |
| `pnpm run doctor:changed` | React Doctor on changed files (not part of `verify`) |

CI uses `biome ci .` for lint; locally `pnpm check` is the usual developer
equivalent. After React/TSX edits, run `pnpm run doctor:changed` in addition to
`pnpm verify`.

## CI

| Workflow | What it runs |
| --- | --- |
| [Lint](.github/workflows/lint.yml) | Biome CI, lockfile validation, React Doctor (`blocking: error`) |
| [Test](.github/workflows/test.yml) | Typecheck, Vitest |
| [Dependency Audit](.github/workflows/audit.yml) | `pnpm audit` |

Triggers: push to `main` and pull requests. Dependabot updates npm and GitHub
Actions weekly ([`.github/dependabot.yml`](.github/dependabot.yml)).

## Layout

```text
apps/web/          React SPA (UI, worker, file I/O)
packages/core/     Framework-free domain library
.agents/           Agent rules, skills, commands, hooks, docs
.github/           CI workflows and Dependabot
```

## Documentation

| Doc | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Agent and contributor index |
| [.agents/docs/ARCHITECTURE.md](.agents/docs/ARCHITECTURE.md) | System architecture and data flow |
| [.agents/docs/DESIGN.md](.agents/docs/DESIGN.md) | Visual identity and design tokens |
| [DeepWiki](https://deepwiki.com/deangrant/json-editor) | Indexed project wiki |

## License

MIT — see [LICENSE](./LICENSE).

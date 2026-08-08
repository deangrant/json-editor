# Agent and contributor guidance

Structured conventions for AI agents and humans working in this repository. For
fuller context, see [README.md](README.md).

## Docs

- [README.md](README.md) — package map and project overview
- [`.agents/docs/ARCHITECTURE.md`](.agents/docs/ARCHITECTURE.md) — high-level system architecture and diagrams
- [`.agents/docs/DESIGN.md`](.agents/docs/DESIGN.md) — visual identity / design tokens for apps/web
- [DeepWiki](https://deepwiki.com/deangrant/json-editor) — indexed project wiki (architecture, API, packages)

## Rules

- [`.agents/rules/`](.agents/rules/) (symlinked from [`.cursor/rules`](.cursor/rules))
- [`.agents/rules/json-editor-conventions.mdc`](.agents/rules/json-editor-conventions.mdc) — always-on monorepo policy
- [`.agents/rules/web-react.mdc`](.agents/rules/web-react.mdc) — `apps/web` React layers
- [`.agents/rules/core-package.mdc`](.agents/rules/core-package.mdc) — `packages/core` domain policy

## Skills

- [`.agents/skills/`](.agents/skills/)
- [`.agents/skills/typescript-project-structure/`](.agents/skills/typescript-project-structure/) — React folder layout and role layers
- [`.agents/skills/solid-typescript-design/`](.agents/skills/solid-typescript-design/) — SOLID design in TypeScript
- [`.agents/skills/jsdoc-typescript-docs/`](.agents/skills/jsdoc-typescript-docs/) — JSDoc and comment conventions
- [`.agents/skills/react-doctor/`](.agents/skills/react-doctor/) — React diagnostics scan and triage
- [`.agents/skills/vitest-web-testing/`](.agents/skills/vitest-web-testing/) — colocated Vitest tests for web and core

## Commands

- [`.agents/commands/`](.agents/commands/) (symlinked from [`.cursor/commands`](.cursor/commands))
- `/verify` — pre-merge checklist (Biome, typecheck, tests, lockfile, audit)
- `/doctor` — React Doctor full triage or changed-scope scan
- `/skills-check` — diff-scoped report against SOLID / structure / JSDoc / conventions

## Hooks

- Config: [`.cursor/hooks.json`](.cursor/hooks.json)
- `afterFileEdit` → [`.agents/hooks/biome-after-file-edit.sh`](.agents/hooks/biome-after-file-edit.sh) and [`.agents/hooks/react-doctor-after-file-edit.sh`](.agents/hooks/react-doctor-after-file-edit.sh)

# Skills check (diff-scoped)

Review changed files against project skills and conventions. **Report only**
unless the user explicitly asks to fix findings.

## Scope

Prefer the git diff against the merge base (or unstaged/staged changes if no
branch base). Focus on TypeScript/TSX under `apps/web` and `packages/core`.

## Check against

1. [solid-typescript-design](../skills/solid-typescript-design/SKILL.md) —
   SRP, ISP, DIP; no fat contexts; inject deps where the codebase already does.
2. [typescript-project-structure](../skills/typescript-project-structure/SKILL.md) —
   role layers (`core` / `patterns` / `containers` / `layouts`); folder-per-component.
3. [jsdoc-typescript-docs](../skills/jsdoc-typescript-docs/SKILL.md) —
   public types/interfaces/classes documented.
4. [json-editor-conventions](../rules/json-editor-conventions.mdc) —
   direct imports (no app barrel imports), kebab-case filenames, Vitest over RTL,
   no render-phase `ref.current` writes.

## Output

For each finding: path, brief issue, which skill/rule, and a one-line suggested
fix. Group by severity (must-fix vs nice-to-have). Do not apply fixes unless
asked.

## Example

```text
/skills-check
```

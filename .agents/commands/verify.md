# Verify (pre-merge)

Run the same checks as the CI Lint and Dependency Audit workflows (Biome,
lockfile, React Doctor, and `pnpm audit`) plus typecheck and
the test suite before merge or PR sign-off.

Prefer the root script when available:

```bash
pnpm verify
```

That runs Biome CI, typecheck, tests, lockfile validation, and audit in order.

## Steps

From repository root, run in order. All must exit zero.

```bash
pnpm exec biome ci .
pnpm run typecheck
pnpm test
pnpm lint:lockfile
pnpm audit
```

(`pnpm verify` is equivalent to the sequence above.)

## Optional

When React/TSX under `src/` changed:

```bash
pnpm run doctor:changed
```

Local mirror of the Lint workflow's **react-doctor** job (`blocking: error`).
Reports only new issues vs the auto-detected base branch (see
[react-doctor skill](../skills/react-doctor/SKILL.md)). Run before merge when
the branch touched React code so CI does not fail on error findings.

When routes, locales, or static export behavior changed:

```bash
pnpm run build
```

## Context

- CI Lint runs two jobs: **lint** (Biome, lockfile) and
  **react-doctor** (`blocking: error`). See
  [`.github/workflows/lint.yml`](../../.github/workflows/lint.yml).
- Dependency Audit runs `pnpm audit` as a hard fail (any advisory fails the
  job). See [`.github/workflows/audit.yml`](../../.github/workflows/audit.yml).
- Biome step matches `biome ci .` in the lint job (local `pnpm run check` is
  the developer equivalent).
- Typecheck uses the recursive `pnpm run typecheck` (`pnpm -r typecheck`);
  catches incomplete locale wiring and cross-file type errors before merge.
- Lockfile validation matches **Validate lockfile**.
- `pnpm audit` matches the Dependency Audit **Run pnpm audit** step.
- `pnpm run doctor:changed` mirrors the **react-doctor** job locally (new
  issues vs base; see skill for flags and triage).
- Tests are not in the lint workflow but are standard pre-merge guard for this
  repo.

Report each command and exit code. If any fail, stop and fix before claiming ready.

## Example

```text
/verify
```

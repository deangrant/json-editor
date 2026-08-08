# Doctor (React diagnostics)

Follow the [react-doctor skill](../skills/react-doctor/SKILL.md). Announce that
you are following it, then scan and fix findings.

## Which scan

| Situation | Command |
| --- | --- |
| Full triage / cleanup / user typed `/doctor` | `pnpm run doctor:full` |
| Pre-merge regression check after React edits | `pnpm run doctor:changed` |

Always invoke via `pnpm run doctor*` — never `npx react-doctor@latest`.

## Fix order

1. Fix **errors** first, then **warnings**.
2. Do **not** add suppressions or disable rules to clear the report.
3. Re-scan with the same command until clean (or until remaining items are
   explicitly deferred with user agreement).

For `/doctor` full triage, also fetch and follow the upstream local-triage
playbook as described in the skill.

## Example

```text
/doctor
```

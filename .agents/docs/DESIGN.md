---
version: alpha
name: JSON Editor
description: >-
  Cool blue-gray document workspace with teal accent, frosted white chrome,
  and IBM Plex for a dense technical JSON editor UI.
colors:
  primary: "#0b6e6a"
  primary-hover: "#095955"
  primary-soft: "#d7efed"
  on-primary: "#ffffff"
  background: "#eef3f6"
  background-mid: "#f3f6f8"
  background-deep: "#e8eef3"
  surface: "#f3f6f8"
  surface-elevated: "#ffffff"
  surface-sunken: "#e7eef3"
  on-background: "#12202e"
  on-background-muted: "#4a5d70"
  on-background-faint: "#7a8fa3"
  outline: "#c9d5e0"
  outline-strong: "#9aafc0"
  danger: "#b42318"
  danger-soft: "#fde8e6"
  warning: "#9a6700"
  warning-soft: "#fff4d6"
  success: "#17663a"
  success-soft: "#def5e7"
  info: "#1d4f91"
  json-string: "#0b6e6a"
  json-number: "#9a6700"
  json-boolean: "#1d4f91"
  json-null: "#7a8fa3"
  json-key: "#12202e"
  chrome: "rgb(255 255 255 / 72%)"
  status-bar: "rgb(255 255 255 / 65%)"
  wash-teal: "rgb(11 110 106 / 12%)"
  wash-blue: "rgb(29 79 145 / 10%)"
typography:
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.2
  button-md:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.2
  button-sm:
    fontFamily: IBM Plex Sans
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.2
  badge:
    fontFamily: IBM Plex Sans
    fontSize: 0.7rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  code-md:
    fontFamily: IBM Plex Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.45
  code-sm:
    fontFamily: IBM Plex Mono
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: 4px
  md: 8px
  full: 9999px
spacing:
  "1": 0.25rem
  "2": 0.5rem
  "3": 0.75rem
  "4": 1rem
  "5": 1.5rem
  "6": 2rem
  toolbar-height: 3rem
  statusbar-height: 1.75rem
  panel-width: 20rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 0.45rem 0.8rem
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-primary-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.sm}"
    padding: 0.3rem 0.55rem
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-background}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 0.45rem 0.8rem
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-background-muted}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-background}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 0.4rem 0.55rem
  input-focus:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-background}"
  badge-neutral:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-background-muted}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  badge-accent:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
  chrome:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.on-background}"
    height: "{spacing.toolbar-height}"
  status-bar:
    backgroundColor: "{colors.status-bar}"
    textColor: "{colors.on-background-muted}"
    typography: "{typography.code-sm}"
    height: "{spacing.statusbar-height}"
  tree-row:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.json-key}"
    typography: "{typography.code-md}"
  tree-row-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.json-key}"
---

# JSON Editor

## Overview

JSON Editor is a dense, technical browser workspace for reading and editing JSON.
The personality is calm and document-like: a cool blue-gray canvas with soft teal
and blue radial washes, frosted white chrome, and elevated white editor surfaces.
Teal (`primary`) is the single brand action color — buttons, focus rings, busy
states, and selected tree rows. IBM Plex Sans carries the UI chrome; IBM Plex
Mono carries tree rows, status telemetry, and code-like content. The emotional
target is focused and precise, not playful and not neon. Default presentation is
**light mode only**; there is no dark theme in the current token set.

Canonical CSS tokens live in
[`apps/web/src/styles/tokens.css`](../../apps/web/src/styles/tokens.css).

## Colors

The palette is cool neutrals plus one teal accent and restrained semantic colors.

- **Primary (#0b6e6a):** Teal accent for primary actions, focus outlines, busy
  status, and selected rows. Soft tint `#d7efed` for backgrounds.
- **Ink (#12202e):** Near-navy body text and JSON keys; muted/faint variants for
  secondary chrome and metadata.
- **Surfaces:** Page wash `#eef3f6` → `#f3f6f8` → `#e8eef3`; elevated panels
  `#ffffff`; sunken chips `#e7eef3`.
- **Outline:** Soft blue-gray borders `#c9d5e0` / `#9aafc0`.
- **Semantic:** Danger, warning, and success with matching soft backgrounds for
  badges and validation.
- **JSON syntax:** String shares teal with primary; number/warning gold;
  boolean/info blue; null faint ink.

Do not introduce a second saturated brand color. Keep orange/purple/glow out of
the product chrome.

## Typography

Two families only:

- **IBM Plex Sans** — toolbar, buttons, labels, panels, prose UI.
- **IBM Plex Mono** — tree view, status bar, and other code-adjacent surfaces.

Fallbacks: `"Segoe UI", sans-serif` for sans; `"Cascadia Code", "Consolas", monospace`
for mono. Keep weights practical (400 body, 500 labels/buttons, 600 badges).
Avoid display/hero type scales; this is an editor, not a marketing page.

## Layout

The shell is a full-viewport grid: toolbar chrome, optional search strip, main
workspace + side panel, status bar. Side panel width is `20rem`
(`--panel-width`). Toolbar height `3rem`; status bar `1.75rem`.

Spacing uses a 4px-based rem scale (`--space-1` … `--space-6`: `0.25rem` …
`2rem`). Prefer compact padding in the editor views; side panels and forms use
`--space-3` / `--space-4` grouping.

Below `900px`, the side panel stacks under the main view at max `40vh`.

## Elevation & Depth

Depth is mostly tonal and frosted, not heavy drop shadows:

- Page background: dual radial washes (teal + blue) over a cool linear gradient.
- Chrome / status bar: translucent white with `backdrop-filter: blur(10px)`.
- Soft shadow `--shadow-sm` on chrome; `--shadow-md` sparingly for overlays.
- Hierarchy: sunken surface < page surface < elevated white editor panels.

Avoid multi-layer dramatic shadows or glow accents.

## Shapes

Corner language is restrained:

- **4px (`rounded.sm`)** — buttons, inputs, most controls.
- **8px (`rounded.md`)** — larger containers when needed.
- **Pill (`rounded.full`)** — badges only.

Keep radii consistent; do not mix large marketing-card radii into the editor.

## Components

Map new UI to existing patterns under `apps/web/src/components/`:

- **Buttons** — `primary` (teal fill), `secondary` (white + border), `ghost`
  (muted text), `danger` (red fill). Sizes `sm` / `md`.
- **Inputs** — white field, soft border; accent border on focus; small muted
  labels above.
- **Badges** — uppercase pill chips with semantic soft backgrounds.
- **Chrome** — frosted top bar holding toolbar and mode switch.
- **Status bar** — mono, muted, compact telemetry (parse state, worker busy).
- **Tree rows** — mono; selected row uses `primary-soft`; syntax colors from
  `json-*` tokens for values.

App code should keep using CSS variables from `tokens.css` rather than hard-coded
hex in new modules when a token already exists.

## Do's and Don'ts

### Do

- Keep the experience light, cool, and document-like.
- Use teal only for action, focus, selection, and brand emphasis.
- Use IBM Plex Sans for chrome and IBM Plex Mono for JSON/code surfaces.
- Prefer borders + tonal surfaces over heavy shadows.
- Match spacing to the existing `--space-*` scale and compact editor density.

### Don't

- Introduce orange, purple, neon, or glow as brand accents.
- Swap in Inter/Roboto/system-only stacks or decorative display fonts.
- Turn the product into a dark dashboard without a deliberate token redesign.
- Use large card radii, pill buttons for primary actions, or dashboard stat strips.
- Hard-code one-off colors when a token in `tokens.css` already covers the role.

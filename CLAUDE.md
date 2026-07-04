# Magoo Component UI

A library of **CSS-less, skeleton UI components** whose primary consumer is an **AI agent**: the agent browses a catalog, picks components that fit a task, and copies boilerplate (structure + behavior) instead of regenerating it — saving tokens. Scales to **1000+ components**, generated for multiple systems from a **single authored source**.

## Core Ideas

- **Single canonical source per component → a generator emits every target.** Author once; generate SDC, Drupal Code Components (Preact), React, Vue, and Storybook. No hand-porting.
- **Components ship no CSS.** Markup is pure **tokenized Tailwind (v4)** — semantic utilities bound to CSS-variable design tokens. Interactivity is **vanilla JS** by default.
- **Granular catalog.** One component per concept (podcast card ≠ movie card ≠ product card), each *modestly* configurable via props — not generic do-everything shells.
- **Rich per-component `metadata.yml`** makes the catalog explorable by an agent (descriptions, use cases, screenshots, WCAG, categorization, example prompts, etc.).
- **Every component maps to Drupal** via a paragraph type + fields + twig template, using **custom_field** for complex/repeating structures.
- **Four example themes** (futuristic, simple, classic, smooth) prove the theming model; a **static preview site** (Astro) + **Storybook** show them off; **Playwright** captures screenshots at 4 breakpoints × 4 themes.

## Targets

| Target | Output | Notes |
|---|---|---|
| Drupal **SDC** | `.component.yml` (JSON-Schema props/slots) + `.twig` + `.js` | Mirrors `../ai_base_theme` conventions; empty placeholder CSS |
| Drupal **Code Component** (Canvas) | Preact/JSX + Canvas metadata | React-compat layer |
| **React** | JSX + `useEffect` behavior | proves generality |
| **Vue** | SFC (`<template>`/`<script setup>`) | proves generality |
| **Drupal paragraph** | paragraph config + twig + `custom_field` config | agent wires component to real content |
| **Storybook** | `.stories.js` (HTML renderer) | argTypes from contract, theme toolbar |

## Canonical Source Format (per component folder)

```
component.def.yml   # contract: props + slots (types, required, default, enum)
template.html       # tokenized-Tailwind markup + minimal directive vocabulary
behavior.js         # optional vanilla ES module: init(root, props) => cleanup
metadata.yml        # agent-exploration metadata (validated against schema)
examples/           # named prop/slot payloads (stories + screenshots)
drupal/             # paragraph + custom_field config + twig
screenshots/        # 16 generated PNGs: <theme>-<breakpoint>.png
```

**Template directives** (small enough to transpile deterministically to twig/JSX/Vue; expressions are dotted paths + `!` negation only — no arbitrary JS):
`{{ prop }}` interpolation · `{{{ prop }}}` raw HTML · `<slot name="x">fallback</slot>` · `data-if="prop"` / `data-if="!prop"` · `data-for="item in items"`.

**JS conventions** (from `../ai_base_theme`): target component-scoped `__hook` classes (e.g. `.card-podcast__player`), separate from styling utilities. Default wrapper is a **portable self-init** (`querySelectorAll(hook).forEach(init)` + `MutationObserver` re-init) that works in Drupal AJAX, Storybook, and static preview; an optional `Drupal.behaviors` variant is emitted for SDC.

## Theming — Shared Token Contract (IMPORTANT)

All themes share **one fixed set of CSS-variable names**; only the *values* differ. Adding a new value set = a new style. Never rename or add variables per theme. Contract lives in `packages/themes/tokens.contract.css` (Tailwind v4 `@theme`).

Representative names (same in every theme): `--color-primary` / `-contrast`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-surface-raised`, `--color-on-surface`, `--color-on-surface-muted`, `--color-border`, `--color-ring`, `--color-{success,warning,danger,info}`; `--font-heading`, `--font-body`, `--font-mono`; `--radius-{control,button,card,pill}`; `--shadow-{card,raised,focus}`; `--space-{section,card,control}`; `--duration-token`, `--ease-token`.

Component markup uses only token-bound utilities (`bg-surface text-on-surface rounded-card shadow-card font-heading`) + `__hook` classes. **Dynamic utility classes** composed from props (e.g. `grid-cols-{{ cols }}`) must be **safelisted** in Tailwind config.

## Conventions

- Component machine-names are kebab-case, domain-prefixed where useful (`card-*`, `match-card-*`, `video-*`, `notification-*`).
- Atomic types: `atom` · `molecule` · `organism` · `full`.
- Generated variants land in a central `dist/<category>/<component>/` mirror; source folders stay clean.

## Skills to use

- **frontend-design** — when authoring the four theme token sets and preview visuals.
- **web-design-guidelines** — when authoring component `template.html` markup.
- **agent-browser** — to preview/verify themes and drive Playwright screenshot capture.
- **superpowers:brainstorming → writing-plans** — process for new scope.

## References

- Approved design/spec: `~/.claude/plans/i-want-to-create-frolicking-walrus.md` (mirrored to `docs/superpowers/specs/` on build).
- First 200 components: `docs/catalog/first-200.md`.
- Work log, decisions, external doc notes: `.agents/`.
- Reference theme (existing SDC patterns): `../ai_base_theme/components/`.
- Drupal SDC props/slots: https://project.pages.drupalcode.org/canvas/sdc-components/
- Drupal Code Components: https://project.pages.drupalcode.org/canvas/code-components/
- custom_field module: https://www.drupal.org/project/custom_field

## Example Components (illustrative — full list in `docs/catalog/first-200.md`)

- **`card-podcast`** *(molecule · media)* — cover image, vertical date, excerpt, inline audio player with scrubbing. Props: `title`, `image`, `excerpt`, `date_*`, `audio_url`. Behavior: `card-podcast__player` audio controls.
- **`bracket-single-elim`** *(full · sports)* — single-elimination knockout bracket. Props: nested `rounds[] → matches[] → teams[]`, `winner` highlight, live-score flag. Proves nested-array rendering.

> Do **not** store the component catalog in this file — keep only a couple of examples. The catalog lives in `docs/catalog/`.

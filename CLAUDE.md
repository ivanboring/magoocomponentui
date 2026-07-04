# Magoo Component UI

A library of **CSS-less, skeleton UI components** whose primary consumer is an **AI agent**: the agent browses a catalog, picks components that fit a task, and copies boilerplate (structure + behavior) instead of regenerating it — saving tokens. Scales to **1000+ components**, generated for multiple systems from a **single authored source**.

## Core Ideas

- **Single canonical source per component → a generator emits every target.** Author once; generate SDC, Drupal Code Components (Preact), React, Vue, and Storybook. No hand-porting.
- **Components ship no CSS.** Markup is pure **tokenized Tailwind (v4)** — semantic utilities bound to CSS-variable design tokens. Interactivity is **vanilla JS** by default.
- **Granular catalog.** One component per concept (podcast card ≠ movie card ≠ product card), each *modestly* configurable via props — not generic do-everything shells.
- **Rich per-component `metadata.yml`** makes the catalog explorable by an agent (descriptions, use cases, screenshots, categorization, example prompts, `relationships` to other components, etc.). Full field list: `docs/metadata-schema.md`.
- **Every component maps to Drupal** via a paragraph type + fields + twig template. The generator emits **importable config YAML** (`drush config:import`) and knows core + contrib field types (Address, Video Embed, Geofield, Office Hours, Table Field, custom_field, …); a prop can pick a field type via `drupal.field_type` (array → one config set per alternative). See `docs/drupal-mapping.md`.
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
`{{ prop }}` interpolation · `{{{ prop }}}` raw HTML · `{{ prop@class }}` variant class-map · `<slot name="x">fallback</slot>` · `data-if="prop"` / `data-if="!prop"` · `data-for="item in items"`. Full reference: `docs/template-directives.md`.

**Variant classes.** An enum prop can't pick different utility classes inline (no equality test), so map them in `component.def.yml` under `variants:` (enum value → class string) and reference `{{ prop@class }}` in the template. The generator inlines it per target. Keep those classes tokenized too.

**JS conventions** (from `../ai_base_theme`): target component-scoped `__hook` classes (e.g. `.card-podcast__player`), separate from styling utilities. Default wrapper is a **portable self-init** (`querySelectorAll(hook).forEach(init)` + `MutationObserver` re-init) that works in Drupal AJAX, Storybook, and static preview; an optional `Drupal.behaviors` variant is emitted for SDC.

## Theming — Shared Token Contract (IMPORTANT)

All themes share **one fixed set of CSS-variable names**; only the *values* differ. Adding a new value set = a new style. Never rename or add variables per theme. Contract lives in `packages/themes/tokens.contract.css` (Tailwind v4 `@theme`).

Representative names (same in every theme): `--color-primary` / `-contrast`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-surface-raised`, `--color-on-surface`, `--color-on-surface-muted`, `--color-border`, `--color-ring`, `--color-{success,warning,danger,info}`; `--font-heading`, `--font-body`, `--font-mono`; `--radius-{control,button,card,pill}`; `--shadow-{card,raised,focus}`; `--space-{section,card,control}`; `--duration-token`, `--ease-token`.

Component markup uses only token-bound utilities (`bg-surface text-on-surface rounded-card shadow-card font-heading`) + `__hook` classes. **Dynamic utility classes** composed from props (e.g. `grid-cols-{{ cols }}`) must be **safelisted** in Tailwind config.

## Conventions

- Component machine-names are kebab-case, domain-prefixed where useful (`card-*`, `match-card-*`, `video-*`, `notification-*`).
- Atomic types: `atom` · `molecule` · `organism` · `full`.
- Generated variants land in a central `dist/<category>/<component>/` mirror; source folders stay clean.
- **Git workflow:** commit directly to `main` — no feature branches needed for component/catalog work. Never push to the remote unless explicitly asked.

## Skills to use

- **frontend-design** — when authoring the four theme token sets and preview visuals.
- **web-design-guidelines** — when authoring component `template.html` markup.
- **agent-browser** — to preview/verify themes and drive Playwright screenshot capture.
- **superpowers:brainstorming → writing-plans** — process for new *structural/tooling* scope (generator, build pipeline, new directive syntax, etc.).
- **Do NOT use superpowers (brainstorming/writing-plans/subagent-driven-development) for authoring an individual catalog component** (or its child components). Component creation follows the fixed shape documented above (`component.def.yml` + `template.html` + `metadata.yml` + optional `behavior.js`/`examples/`) and reference components to copy — author it directly, in one pass, without a brainstorming/planning/review loop.

## Commands

```
pnpm install
pnpm test            # generator + schema unit tests (node --test)
pnpm build           # generate dist/<id>/ variants + dist/catalog.json
pnpm preview:dev     # browse the catalog across all 4 themes (localhost:4321)
pnpm storybook       # component workbench (theme toolbar)
pnpm screenshots     # capture 4 themes × 4 breakpoints/component (Playwright)
pnpm audit           # axe-core a11y + semantics audit → dist/audit.json
```

## Verification vs. asserted metadata

`metadata.yml` fields `categorization.wcag` and `seo_score` are **author-asserted, not tested**.
`pnpm audit` runs **axe-core (WCAG 2.0/2.1 A+AA)** against each rendered component plus a
semantics heuristic (headings/landmarks/alt/accessible-names), writes `dist/audit.json`, and
**flags where asserted values disagree with measured**. (Lighthouse SEO is page-level and not
meaningful per-component, hence the heuristic.)

## Reference components to copy (real, on disk)

- `components/notifications/alert/` — enum **variant class-map**, dismiss **behavior.js** (data-attr config + ARIA), a **slot**, full metadata.
- `components/dashboard/stat-card/` — multiple props, trend variant, icon slot, no JS.
- `components/marketing/feature-grid/` — **`data-for` loop** + responsive columns (1→2→3→4).
- `components/dashboard/stats-band/` — **slot composition** + a real parent↔child `relationships` link to `stat-card`.

## Docs & references

- Design spec: `docs/superpowers/specs/2026-07-04-skeleton-component-library-design.md`.
- **Authoring**: `docs/authoring-guide.md` · `docs/template-directives.md` · `docs/metadata-schema.md` · `docs/theming.md` · `docs/drupal-mapping.md` · `docs/taxonomy.md`.
- **Catalog worklist** (names/ideas only, not built): `docs/catalog/first-200.md` (218) + `docs/catalog/next-500.md` (500) ≈ 718 planned.
- **Current state / decisions / researched facts**: `.agents/progress.md`, `.agents/decisions.md`, `.agents/references.md`.
- Reference theme (existing SDC patterns): `../ai_base_theme/components/`.
- Drupal: [SDC](https://project.pages.drupalcode.org/canvas/sdc-components/) · [Code Components](https://project.pages.drupalcode.org/canvas/code-components/) · [custom_field](https://www.drupal.org/project/custom_field).

> Keep the component catalog in `docs/catalog/`, not in this file.

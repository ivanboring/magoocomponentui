# Skeleton Component Library — Foundation & Proof Set

## Context

We are building a library of **CSS-less, skeleton UI components** whose primary consumer is an **AI agent**: the agent browses a catalog, picks components that fit a task, and copies boilerplate (structure + behavior) instead of regenerating it — saving tokens. The library must scale to **1000+ components** and target multiple systems from a **single authored source**:

- **Drupal SDC** (Single Directory Components) — `.component.yml` (JSON-Schema props/slots) + `.twig` + `.js`
- **Drupal Code Components** (Canvas) — Preact/JSX + Canvas metadata
- **React** and **Vue** (proving the abstraction generalizes)
- **Drupal paragraph + custom_field** entity mapping per component, so the agent can wire a component to real content

Constraints established with the user:
- **Single canonical source per component + a generator** emits all framework variants.
- **No CSS ships in components.** Markup is pure, *tokenized* Tailwind (v4 semantic utilities bound to CSS-variable design tokens). Four themes (futuristic, simple, classic, smooth/rounded/feminine) redefine only the token layer, so one markup renders as four looks.
- Every component carries a rich **`metadata.yml`** for agent-driven exploration.
- A **static** preview site (Astro) with category/subcategory menu + frontend search + screenshot listings.
- **Storybook** template per component.
- **Screenshots**: 4 themes × 4 breakpoints = **16 PNGs per component**, auto-captured (Playwright).
- Generated variants land in a **central `dist/` mirror**; component source stays clean.
- **This plan delivers the full pipeline + a ~8-component proof set.** Enumerating the 1000+ catalog is the explicit next step, not part of this build.

Out of scope now: the agent-facing CLI (designed-for, deferred); authoring the full catalog.

## Goals / Non-Goals

**Goals**
1. A canonical component format + a real generator that emits SDC, Code Component, React, Vue, and Storybook variants.
2. A validated `metadata.yml` schema covering every field the user listed.
3. Drupal paragraph + custom_field templates + a documented prop→field mapping.
4. Four tokenized Tailwind themes.
5. Static Astro preview site + Storybook + Playwright screenshot pipeline.
6. ~8 exemplar components proving the pipeline end-to-end across all atomic types, prop types, slot shapes, loops/conditionals, and interactive JS.

**Non-Goals**
- The CLI, the full catalog, per-market content, or production Drupal install/theme.

## Architecture Overview

```
component source (1 folder)
├─ component.def.yml   ← machine contract: props + slots (types, required, default, enum)
├─ template.html       ← tokenized Tailwind markup + minimal directive vocabulary
├─ behavior.js         ← optional vanilla ES module: init(root, props) => cleanup
├─ metadata.yml        ← agent-exploration metadata (validated against schema)
├─ examples/           ← named prop/slot payloads used by stories + screenshots
├─ drupal/             ← paragraph config + twig + custom_field config
└─ screenshots/        ← 16 generated PNGs (theme-breakpoint.png)
              │
       generator (parse template.html → AST, read def.yml)
              ▼
dist/<category>/<component>/
├─ sdc/<name>/{<name>.component.yml, <name>.twig, <name>.js}
├─ code-component/{<name>.jsx, metadata}
├─ react/<name>.jsx
├─ vue/<name>.vue
└─ stories/<name>.stories.js
```

**Why tokenized Tailwind:** the only way `no component CSS` + `pure Tailwind` + `4 distinct themes` can coexist. Markup uses semantic utilities (`bg-surface`, `text-on-surface`, `rounded-token`, `shadow-token`, `font-heading`, `p-space-4`) mapped in Tailwind v4 `@theme` to CSS variables. Each theme is one CSS file redefining `--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, spacing rhythm. Same markup, four looks, zero component CSS.

**Why vanilla-JS behavior contract:** `behavior.js` exports a framework-agnostic `init(rootEl, props) => cleanup`. The generator wraps it per target — Drupal `Drupal.behaviors` + `once()` for SDC, `useEffect(ref)` for Preact/React, `onMounted`/`onUnmounted` for Vue. Keeps interactivity reusable everywhere.

## Repo Structure (pnpm workspaces + TypeScript)

```
/
├─ package.json (workspaces), pnpm-workspace.yaml, tsconfig.base.json
├─ components/<category>/<component>/…        # canonical source (above)
├─ dist/…                                     # generated variants (build output)
├─ packages/
│  ├─ generator/     # template parser (AST) + per-target emitters
│  ├─ schema/        # metadata JSON Schema + ajv validator + catalog builder
│  └─ themes/        # 4 Tailwind v4 @theme token CSS files + shared tokens contract
├─ preview/          # Astro static site (reads dist/catalog.json)
├─ .storybook/       # Storybook (HTML renderer) config + theme toolbar
├─ scripts/
│  ├─ build.mjs         # run generator over all components → dist/
│  ├─ build-catalog.mjs # validate metadata + emit dist/catalog.json
│  └─ screenshot.mjs    # Playwright: 4 themes × 4 breakpoints per component
└─ docs/
   ├─ authoring-guide.md, template-directives.md, metadata-schema.md
   ├─ drupal-mapping.md, theming.md, taxonomy.md
   └─ superpowers/specs/<date>-skeleton-component-library-design.md  # spec copy
```

## Canonical Component Format

**`component.def.yml`** — single source of truth for the contract:
```yaml
name: card
props:
  title:   { type: string, required: true, title: Title }
  variant: { type: enum, values: [default, outlined, elevated], default: default }
  href:    { type: link }
  image:   { type: image }
  featured:{ type: boolean, default: false }
slots:
  body:    { title: Body, description: Main card content }
```
Supported prop types (map cleanly to every target): `string`, `html` (rich), `text` (multiline), `integer`, `boolean`, `enum`, `link`, `image`, `array` (with `items`), `object`.

**`template.html`** — valid HTML5 + a **minimal directive vocabulary** (small enough to transpile to twig/JSX/Vue deterministically; expressions limited to dotted paths and `!` negation — no arbitrary JS):
- `{{ prop }}` — text / attribute interpolation
- `{{{ prop }}}` — raw HTML (html-typed props)
- `<slot name="body">fallback</slot>` — named slot
- `data-if="featured"` / `data-if="!featured"` — conditional element
- `data-for="item in items"` — loop; inner uses `{{ item.field }}`

Parsed with `parse5`/`node-html-parser` into an AST that each emitter walks.

**`behavior.js`** — `export default function init(root, props) { …; return () => cleanup }`. Interactive components (accordion, tabs, dismissible alert) implement full keyboard + ARIA here so WCAG/keyboard-support metadata is real, not aspirational.

## Metadata Schema (`metadata.yml`)

JSON Schema in `packages/schema`, validated by ajv in `build-catalog`. Fields (all from the user's list):
`short_description`, `long_visual_description`, `use_cases[]` (5–15), `screenshots{theme:{breakpoint:path}}` (16), `recommended_for[]`, `avoid_for[]`, `markets[]`, `example_usage`, `props{<name>: usage_prose}` (augments `component.def.yml`, keyed by prop — no duplication of types), `slots{<name>: usage_prose}`, `example_prompts[]`, `lifecycle` (experimental|stable|deprecated), `content_model`, `theming{tokens_used[]}`, `editorial_guidance`, `categorization{category, subcategory, atomic_type (atom|molecule|organism|full), usage_type (grid|card|highlight|list-item…), maturity (ai-generated|human-approved|production-ready), wcag, keyboard_support, seo_score, text_direction (ltr|rtl|both)}`.
`component.def.yml` owns prop/slot *types*; `metadata.yml` owns prop/slot *prose*. `build-catalog` merges both into `dist/catalog.json` for preview + future CLI.

## Generator Emitters (`packages/generator`)

One AST → five outputs:
- **SDC**: `<name>.component.yml` (props → JSON Schema incl. image `$ref: json-schema-definitions://canvas.module/image`, enum + `meta:enum` labels; slots block); `<name>.twig` (`{{ prop }}`, `{{{ }}}`→`|raw`, `<slot>`→`{{ slotname }}`, `data-if`→`{% if %}`, `data-for`→`{% for %}`); `<name>.js` (behavior wrapped in `Drupal.behaviors` + `once()`).
- **Code Component (Preact)**: `<name>.jsx` (props destructure, `class`→`className`, `data-if`→`{cond && …}`, `data-for`→`{items.map(…)}`, slots→named children props, behavior→`useEffect(ref)`) + Canvas component metadata.
- **React**: same JSX transform (React import), behavior via `useEffect`.
- **Vue**: `<name>.vue` SFC — `<template>` (`v-if`, `v-for`, `:class`, `<slot name>`) + `<script setup>` (`defineProps`) + behavior in `onMounted`/`onUnmounted`.
- **Storybook**: `<name>.stories.js` (HTML renderer) — `argTypes` from `component.def.yml`, stories from `examples/`, theme selected via global toolbar.

## Drupal Paragraph + custom_field Integration (`components/*/drupal/` + templates)

Per component, generated/scaffolded from `component.def.yml`:
- **Paragraph type config** (`paragraph.<name>.yml`) — bundle + fields. Prop→field mapping: `string`→text; `text`→text_long; `enum`→list_string; `boolean`→boolean; `integer`→integer; `link`→link; `image`→media/image; `array`/`object`→**custom_field** with subfields; slots→text_long or nested paragraph field.
- **Twig template** `paragraph--<name>.html.twig` — renders the SDC and maps paragraph fields → props/slots.
- **custom_field config** (`custom_field.<name>.yml`) for complex/repeating props + a **generic custom_field template** the agent can adapt (custom_field ships an SDC formatter, so complex fields map straight onto components).
- `docs/drupal-mapping.md` documents the full mapping table.

## Themes (`packages/themes`)

**Single shared token contract; themes differ only in values.** `packages/themes/tokens.contract.css` declares the *canonical, fixed set of CSS-variable names* (Tailwind v4 `@theme` namespaces so utilities auto-generate). **Every theme redefines the exact same variable names — never adds or renames.** Consequence (explicit user requirement): dropping in a new set of variable *values* yields a brand-new style; authoring a theme = copy the contract and change values only.

Canonical contract (representative — same names in all themes):
- **Color** → `--color-primary`, `--color-primary-contrast`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-surface-raised`, `--color-on-surface`, `--color-on-surface-muted`, `--color-border`, `--color-ring`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info` (+ `-contrast`). → `bg-primary`, `text-on-surface`, `border-border`, …
- **Type** → `--font-heading`, `--font-body`, `--font-mono` (+ `--font-weight-heading`, `--tracking-heading`). → `font-heading`, `font-body`.
- **Radius** → `--radius-control`, `--radius-button`, `--radius-card`, `--radius-pill`. → `rounded-card`, `rounded-button`.
- **Shadow** → `--shadow-card`, `--shadow-raised`, `--shadow-focus`. → `shadow-card`.
- **Spacing/rhythm** → `--space-section`, `--space-card`, `--space-control`.
- **Motion** → `--duration-token`, `--ease-token`.

Component markup only ever uses utilities bound to these tokens (`bg-surface rounded-card shadow-card font-heading text-on-surface p-[--space-card]`) plus component-scoped `__hook` classes for JS. Four value sets:
- **simple** — the contract's default values: neutral, minimal, subtle radius, flat/soft shadows.
- **futuristic** — neon/high-contrast, mono/geometric type, `--radius-*: 0`, glow shadows.
- **classic** — serif headings, traditional palette, moderate radius.
- **smooth** — warm/feminine palette, large radius, soft diffuse shadows.

Theme token sets + preview visuals are authored with the **frontend-design** skill; **agent-browser** is used to preview/verify themes and capture screenshots.

## Preview Site (`preview/`, Astro static)

- Reads `dist/catalog.json`. Category→subcategory nav; **client-side search** island (Fuse.js) over descriptions/use-cases/tags.
- Listing cards show the **16-screenshot grid**.
- Detail page renders the canonical markup live under a **theme switcher** (all 4 theme stylesheets, toggle) at responsive breakpoint frames, plus full metadata, props/slots tables, and example prompts.
- `astro build` → fully static `dist` deployable anywhere.

## Screenshot Pipeline (`scripts/screenshot.mjs`, Playwright)

Iterates each component × 4 themes × 4 breakpoints (mobile 375 / tablet 768 / small 1024 / desktop 1440), renders the canonical markup (via a minimal render route) with the theme stylesheet, captures `screenshots/<theme>-<breakpoint>.png`, and writes paths into `metadata.yml`.

## Reference Theme Learnings (`../ai_base_theme/components`)

The user's existing theme is hand-authored SDC; it is effectively the *target shape* of our SDC emitter and confirms the granular, domain-specific catalog vision (`card-podcast`, `card-product`, `card-profile` are separate components). Conventions we adopt:

- **SDC output shape**: `.component.yml` uses `$schema: …/core/assets/schemas/v1/metadata.schema.json` and carries extended cataloging fields (`status`, `group`, `long_description`, `visual_description`, `typical_usage`, `attribution`, `libraryOverrides`). Our SDC emitter mirrors this so generated components drop straight into a Drupal theme; the richer agent-facing metadata still lives in `metadata.yml` and the catalog.
- **JS-hook classes**: interactive markup uses component-scoped BEM hooks (`.card-podcast__player`, `.card-podcast__audio`) for JS targeting, *separate from* the tokenized Tailwind styling utilities. `behavior.js` targets these hooks.
- **Portable behavior pattern**: reference JS self-initializes via a `querySelectorAll(hook).forEach(init)` + `MutationObserver` re-init (works in Drupal AJAX, Storybook, static preview) — no hard Drupal core dependency. Our canonical `behavior.js` stays `init(root, props) => cleanup`; the default wrapper emits this portable self-init form (usable everywhere), with an optional `Drupal.behaviors` wrapper variant for SDC.
- **Slots for composition**: organisms accept child components through slots (`{{ items }}` / `{{ content.<slot> }}`), matching SDC. Our slot directive maps to this.
- **Dynamic utility classes**: props compose classes (`grid-cols-{{ cols }}`). Preview/Storybook Tailwind config must **safelist** these dynamic class patterns.
- **CSS files** exist only as empty placeholders — confirms the no-CSS constraint.

## Catalog Vision (informs taxonomy + this proof set)

The catalog must eventually cover *entire site domains* with **specific** components (one per concept, each modestly configurable), e.g.:
- **Sports / World Cup**: single-elimination bracket, live match result, group-stage table, fixture list, player/team cards, live ticker.
- **Video / media**: live video player, VOD player, scrubber, YouTube-style transcript, playlist item, channel header.
- **Notifications**: toast, banner, notification list item, badge count, inbox drawer.
- **…and broadly "everything"** (commerce, editorial, marketing, navigation, forms, data-display). `docs/taxonomy.md` is seeded across these domains to tee up catalog planning.

## Proof Set (9 components — technical + domain coverage)

Revised to prove the format against the user's real intent: complex, domain-specific components — not just generic UI atoms.

| Component | Atomic | Domain | Exercises |
|---|---|---|---|
| Button | atom | generic | enum variant, link, icon slot, no JS |
| Badge | atom | generic | enum, string |
| Card Grid | organism | generic | **slot composition** (`items` slot accepts children), dynamic `grid-cols` props (safelisting) |
| Podcast Card | molecule | media | image/date/excerpt, conditional (`data-if`), **audio player JS + scrubbing** (mirrors reference) |
| Notification Toast | molecule | notifications | enum severity, **JS auto-dismiss/stacking**, ARIA live region |
| Accordion | organism | generic | **array/loop**, **JS** expand/collapse, keyboard + ARIA |
| Tabs | organism | generic | array, **JS** arrow-key nav, ARIA tablist |
| Tournament Bracket (single-elimination) | full | sports | **nested arrays** (rounds→matches→teams), conditional winner highlight, live-score prop |
| Video Player + transcript | full | video | **complex JS**: play/pause/scrub + **transcript-cue array sync** (YouTube-style) |

Covers every prop type (incl. nested arrays/objects), single/named/looped/composition slots, conditionals, loops, JS ranging none→simple→complex, real keyboard/WCAG support, and four genuinely complex/domain-specific components (podcast/audio, notifications, bracket, video) that de-risk the format for the 1000+ catalog.

## Build Order

1. Scaffold repo (pnpm workspaces, TS, Tailwind v4, 4 theme token files, tsconfig).
2. `component.def.yml` shape + **template directive parser → AST** (`packages/generator`), with unit tests.
3. Metadata JSON Schema + ajv validator + `build-catalog` → `dist/catalog.json`.
4. Emitters: SDC → Code Component → React → Vue → Storybook (each unit-tested against a fixture component).
5. Drupal paragraph + custom_field scaffolding + generic templates + `drupal-mapping.md`.
6. Author the 8 proof-set components (source only).
7. `scripts/build.mjs` full pipeline → `dist/`; wire Storybook (HTML) + theme toolbar.
8. Astro preview site over `dist/catalog.json`.
9. Playwright screenshot pipeline → 16 PNGs/component; backfill metadata paths.
10. Docs (authoring, directives, theming, taxonomy) + write spec copy to `docs/superpowers/specs/`.

## Verification (end-to-end)

- `pnpm build` generates all 5 variants for all 8 components with no errors.
- `pnpm typecheck`/lint pass on generated React/Vue/JSX; generated `.component.yml` validates as JSON Schema; a twig lint/parse check on generated SDC templates.
- `build-catalog` validates all 8 `metadata.yml` against schema; `dist/catalog.json` produced.
- `astro build` produces a static site; open it and confirm nav, search, theme switch, and 16-image grids render.
- `storybook build` succeeds; each component shows with arg controls + theme toolbar.
- `scripts/screenshot.mjs` writes 16 PNGs per component (128 total) across all 4 themes/breakpoints.
- Interactive components (Accordion/Tabs/Alert) verified for keyboard + ARIA in the preview.
- Spot-check: one component's Drupal paragraph twig maps fields → props correctly (schema/parse validation, since no live Drupal).

## Next Step (after this build)

Plan the **first list of 1000+ components**: use `docs/taxonomy.md` (category→subcategory, atomic types, usage types seeded here) to enumerate the initial batch, prioritized by coverage and agent utility. This becomes its own spec → plan cycle.

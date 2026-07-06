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
- **Images:** when an example/screenshot needs a real image (not a placeholder box), download a generic one from https://unsplash.com/ rather than inventing a URL or using a data URI.

## Skills to use

- **frontend-design** — when authoring the four theme token sets and preview visuals.
- **web-design-guidelines** — when authoring component `template.html` markup.
- **agent-browser** — to preview/verify themes and drive Playwright screenshot capture.
- **superpowers:brainstorming → writing-plans** — process for new *structural/tooling* scope (generator, build pipeline, new directive syntax, etc.).
- **Do NOT use superpowers (brainstorming/writing-plans/subagent-driven-development) for authoring an individual catalog component** (or its child components). Component creation follows the fixed shape documented above (`component.def.yml` + `template.html` + `metadata.yml` + optional `behavior.js`/`examples/`) and reference components to copy — author it directly, in one pass, without a brainstorming/planning/review loop.

## Authoring gotchas (learned the hard way — run `pnpm build` after every component)

- `metadata.yml` `use_cases` is validated **5–15 items** when present (ajv). Always write at least 5.
- **Use an ASCII hyphen `-` (U+002D), never a Unicode minus `−` (U+2212)** in `metadata.yml` and
  `component.def.yml` (grades like `A-`, ranges, `price - down`, etc.). The minus sign looks
  identical but is a different character; keep the source ASCII. Quick check:
  `grep -rn $'−' --include=metadata.yml --include=component.def.yml components/`.
- `{{ }}` / `{{{ }}}` interpolation does **not** support `!` negation (`{{ !label }}` throws a parse
  error) — `!` negation is **only** valid inside `data-if="!path"`. To vary an attribute by a
  boolean/falsy prop, either always emit the prop value as-is (e.g. `aria-label="{{ label }}"`
  left empty when unset) or use a `data-if` on a wrapping element instead.
- When a value needs arithmetic the directive language can't do (star-fill state, an avatar-group
  overflow count, an SVG `stroke-dashoffset`, a computed initials string), add a prop that expects
  the **caller to pass the precomputed value** (e.g. `rating-stars.items[].filled`,
  `avatar-group.overflow_count`, `progress-circle.dash_offset`) rather than inventing new directive
  syntax. Document the expected precomputation in the prop's `description`.
- Tailwind data-attribute variants (e.g. `data-[selected=true]:bg-primary`,
  `data-[filled=false]:opacity-25`) work fine since the class string is static in `template.html`
  (Tailwind's content scan sees it literally) — use this for JS-driven toggle states instead of
  `variants:`/`@class` (which only covers enum props known at render time). Same goes for
  `group-hover:*` / `group-focus-within:*`. If a live check ever seems to show one of these not
  applying, suspect the *check* (stale hover/mouse state between separate CLI calls) before the
  component — `grep` the compiled CSS in `preview/dist/_astro/*.css` for the exact class first;
  if the rule is present, re-verify hover/click state and computed style in a single `eval` call.
- **Every component needs curated `examples/*.json`, not just the four required source files.**
  `examples/default.json` (→ Storybook "Default" story) becomes the static preview's and the
  screenshot pipeline's render data — skip it and the component only ever displays generic
  autogenerated placeholder args. Add a second named example for any component with a visually
  distinct alternate state (severity variant, selected/removable, empty vs. filled, sold-out, …),
  matching `components/notifications/alert/examples/` and `components/events/ticket-card/examples/`.
- **Real example images**: verify a photo is genuinely real (not a guessed URL) by fetching its
  actual `unsplash.com/photos/<id>` page with WebFetch and reading the true `images.unsplash.com`
  CDN URL out of the page — never invent a photo ID. Then `curl` it (sized via `?w=&h=&fit=crop`
  query params, `q=70`, `fm=jpg` to keep the repo small) into `preview/public/stock/<descriptive-name>.jpg`
  and reference it from `component.def.yml`/`examples/*.json` as an absolute path
  (`/stock/avatar-woman-1.jpg`) — never a live hotlink or a data URI. This path resolves for free
  in the Astro preview (serves `preview/public/` at `/`); `.storybook/main.js` has
  `staticDirs: ["../preview/public"]` so Storybook resolves it too; the screenshot pipeline has no
  HTTP server, so `scripts/screenshot.mjs` inlines any `/stock/...` string in the render args as a
  base64 data URI just for that pass (see `inlineStockImages()`) — don't touch the source examples
  to work around that, the inlining is generic and already handles it.
- **Empty `src`/`href` resolves to the page URL.** A media element rendered with an empty
  attribute (`<audio src="{{ audio_src }}">` when `audio_src` is "") produces `src=""`, and the
  browser resolves the *property* `el.src` to the current page URL — which is truthy. This silently
  broke card-podcast's play toggle (`if (audio.src)` was always true, so it tried to play the HTML
  page as audio). Guard the whole media element with `data-if="audio_src"` (or `poster`, `image`,
  …) so it isn't rendered at all when there's no source, rather than emitting an empty `src`.
- **YAML list-item trap**: a `use_cases`/`example_prompts` item whose text *starts* with a `"`
  (e.g. `- "More" overflow menu`) is parsed as a quoted scalar and the trailing text throws; an
  item containing a bare colon (`- Activity row: something`) parses as a map. Rephrase so items
  don't start with a quote and don't contain `: ` — or quote the entire item. A fast pre-build
  check: `for f in components/*/*/metadata.yml; do python3 -c "import yaml;yaml.safe_load(open('$f'))" || echo BAD $f; done`.
- **Authored human name**: every `metadata.yml` starts with `name: "Human Readable Name"` (e.g.
  `name: "Mega-menu Navbar"` for machine-name `navbar-mega`). It's optional in the schema — the
  catalog falls back to a title-cased machine name — but author it so the preview reads well. The
  preview shows this `display_name` as the heading with the kebab machine name in a mono chip below.
- **Container vs leaf-card convention (drives the preview's "show inside a container" dropdown).**
  A **container** exposes an `items` or `plans` **slot** (card-grid, product-grid, card-slider,
  masonry-grid, card-rail, pricing-tiers, cart-drawer, notification-inbox, …) — that slot is the
  reliable signal, NOT `usage_type: grid` (leaf cards are tagged `grid` to mean "shown in a grid").
  A **leaf card** has `usage_type` including `card` and no items/plans slot. On leaf-card detail
  pages only, the preview shows a dropdown that renders the card inside real generic containers
  (Card grid ×1–4, Card slider, Masonry grid, Card rail) plus any specific container whose
  `relationships.children` lists this card AND which has an items/plans slot (e.g. card-pricing →
  Pricing Tiers). So: give a new container an `items` slot; declare `relationships.children` on it
  to auto-wire the specific-container option; keep leaf cards slot-free. The full-width toggle and
  the compact one-row-per-theme screenshots live on the same detail page.
- **Multiple examples all render now**: the build writes `dist/<id>/examples.json` (the full
  `examples/*.json` map), and the preview detail page renders **every** named example as its own
  theme-switchable stage (not just Default). This is how alternate states become visible (an
  avatar's initials fallback, pagination's first-page, a sold-out ticket) — so a second example is
  the way to show a variant, and it will actually appear on the page.
- **Screenshots must be regenerated when you add/rename components**: `pnpm screenshots` captures
  16 PNGs/component and the index cards + detail pages show them. Run it (after `pnpm build &&
  pnpm preview:build`) once a batch of components is done; otherwise new components show the live
  DOM render instead of screenshots.
- **Always visually check new/changed components before considering them done**, using the
  `agent-browser` skill against the real running preview:
  1. `pnpm build && pnpm preview:build` (the Astro build **caches** — if a source change to
     `preview/src/**` doesn't show up, `rm -rf preview/.astro preview/dist` first, then rebuild).
  2. Serve it by the workspace-local binary with an explicit root — `pnpm exec astro` from the repo
     root fails with "astro not found" (it's a preview-workspace dep), and `cd preview` silently
     changes cwd for later commands. Use:
     `preview/node_modules/.bin/astro preview --root preview --port 4321` (run detached).
  3. **Kill stale servers first** — orphaned `astro dev`/`preview` node procs survive `pkill -f`
     and keep serving old output on the port (symptom: the browser shows a different/old component
     count than `curl`). Kill by the port's PID: `ss -ltnp | grep :4321` → `kill -9 <pid>`.
  4. `agent-browser open http://localhost:4321/c/<category>/<name>` + `screenshot` + `Read` the PNG.
     If the browser DOM looks stale vs. `curl` of the same URL (Chromium profile cache), serve on a
     fresh port or `agent-browser close --all` then reopen; trust `curl`/in-page `fetch` over the
     cached tab.
  `pnpm build`/`pnpm test` only prove the generators and schema validate; they render nothing, so
  they miss dead Tailwind classes, broken hover/click states, and layout problems that only show
  up in an actual browser.
- First 218-component catalog build order in progress: **Atoms & Primitives (1–16) ✅ and Navigation
  (17–30) ✅** done as of 2026-07-04; Overlays in progress (`modal` done). Continue through
  `docs/catalog/first-200.md` in list order: rest of Overlays (#31–42), Notifications (partially
  done: `alert`), Cards, Video/Media, Sports, Commerce, Editorial, Marketing (partially done:
  `feature-grid`), Data, Forms, Social, Layout, Dashboard (partially done: `stat-card`,
  `stats-band`). Events domain (`ticket-card`, `ticket-selector`) was added outside the original
  218 and doesn't need revisiting.

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

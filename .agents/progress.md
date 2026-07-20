# Progress

## Done
- **Brainstormed + approved design.** Full spec at `~/.claude/plans/i-want-to-create-frolicking-walrus.md`.
- **Researched** Drupal SDC (props/slots schema, twig `{{ slot }}`), Code Components (Preact), custom_field. See `references.md`.
- **Studied reference theme** `../ai_base_theme/components` — extracted SDC output shape, portable JS pattern, `__hook` class convention, slot composition, dynamic-class safelisting. See `references.md`.
- **Authored first 200 components** → `docs/catalog/first-200.md` (Sports/World Cup, Video, Notifications covered deeply; 9-component proof set identified).
- **Wrote project `CLAUDE.md`** (durable design + conventions + token contract + references).
- **Locked shared token-contract** requirement: identical CSS-variable names across all four themes; only values differ.
- Toolchain: Node 24, pnpm 11 (via corepack). Project is greenfield (no scaffold yet).

## Next (build order — tracked in the task list)
1. ✅ Scaffolded monorepo (pnpm workspaces, Node ESM + JSDoc, root config). `@magoo/themes`: `tokens.contract.css` (shared contract) + 4 value sets (simple/futuristic/classic/smooth) + `index.css` (Tailwind v4 + safelist + theme base). Designed with frontend-design skill.
2. ✅ `@magoo/generator`: `parser.js` (template.html → AST: element/text/slot + `{{ }}`/`{{{ }}}`/`data-if`/`data-for`) and `def.js` (component.def.yml normalizer). 9 unit tests pass (`pnpm test`).
3. ✅ `@magoo/schema`: metadata JSON Schema + ajv validator + catalog builder (`dist/catalog.json`). 6 tests.
4. ✅ Emitters (all in `@magoo/generator`, 18 tests): reference AST→HTML renderer, SDC (component.yml+twig+js), Preact code component, React, Vue, Storybook. Portable self-init behavior wrapper.
5. ✅ Drupal emitter: `fields.yml` + `paragraph--<name>.html.twig` + inferred `custom_field` columns. `docs/drupal-mapping.md`.
   Build pipeline: `scripts/build.mjs` (generate → `dist/<id>/`) + `scripts/build-catalog.mjs`. `pnpm build` runs both. MIT licensed.

### STRUCTURE — COMPLETE ✅
- ✅ variant→class mapping (`variants:` + `{{ prop@class }}`) across all targets.
- ✅ Storybook (`.storybook/`) — HTML renderer, theme toolbar, web fonts; `storybook build` green.
- ✅ Astro static preview — top search + category dropdown, live theme switch, screenshot grid, props/slots + metadata.
- ✅ Playwright screenshot pipeline (`scripts/screenshot.mjs`) — 16/component; catalog auto-detects them.
- ✅ Docs: authoring-guide, template-directives, metadata-schema, theming, taxonomy, drupal-mapping, README, spec copy.
- ✅ Reference component `notifications/alert` (variants + JS + slot + 16 screenshots) — kept as the worked example.
- Verified: `pnpm test` (31), `pnpm build`, `pnpm preview:build`, `pnpm storybook:build`, `pnpm screenshots` all green.

### PAUSE POINT — hand off to another model for component authoring
Structure is done. **Authoring the 218-component catalog is deferred to another model/session** per the user. To add a component: create `components/<category>/<name>/` with `component.def.yml` + `template.html` + `metadata.yml` (+ optional `behavior.js` / `examples/`), then `pnpm build`. Copy `components/notifications/alert/` as the template. Read `docs/authoring-guide.md`, `docs/template-directives.md`, `docs/theming.md`.

### CATALOG AUTHORING — in progress (2026-07-04/05)
**CATALOG COMPLETE — 223 components built** (all 218 planned + card-slider/masonry-grid/card-rail containers + video-premiere). All 11 first-200 domains done: Atoms, Navigation, Overlays, Notifications, Cards, Video/Media, Sports, Commerce, Editorial, Marketing, Data, Forms, Social, Layout, Dashboard. Skipped as machine-name dup: Data #162 stat-card, Marketing #155 stats-band (exist under dashboard/). Next: `docs/catalog/next-500.md` (500 more) when resumed.

---
(historical) Authoring the 218 catalog components directly (per CLAUDE.md, no superpowers loop). **177 built so far.** Completed domains, in `docs/catalog/first-200.md` order:
- **Atoms (1–16)** ✅ · **Navigation (17–30)** ✅ · **Overlays (31–42)** ✅ · **Notifications (43–56)** ✅ · **Cards (57–76)** ✅ · **Video/Media (77–94)** ✅ · **Sports/World Cup (95–116)** ✅ · **Commerce (117–132)** ✅ · **Editorial (133–144)** ✅ · **Marketing (145–160)** ✅ · **Data (161–172)** ✅.
- **Extra container components** (Layout/Grids, for the preview "show inside a container" dropdown): `layout/card-slider`, `layout/masonry-grid`, `layout/card-rail` (+ existing `cards/card-grid`, `commerce/product-grid`).
- Pre-existing / dedup-skipped (machine-name collisions avoided): `marketing/feature-grid`, `dashboard/stat-card` (Data #162 stat-card skipped), `dashboard/stats-band` (Marketing #155 skipped), `events/*`.
- **Remaining to reach 218:** Forms (173–184, 12), Social (185–194, 10), rest of Layout (195–200: section-wrapper, sidebar-layout, accordion, sticky-header, footer-columns — masonry-grid done), Dashboard (201–218, minus existing stat-card/stats-band). ~43 left.
- **Preview features added this pass** (see CLAUDE.md): theme+breakpoint persistence (localStorage), Hide-atoms, container-dropdown on leaf cards (renders card inside real grid/slider/masonry/rail via relationships graph), compact one-row equal-height cropped screenshots, full-width toggle. Screenshots regenerated for all 177.
- Reusable stock images in `preview/public/stock/`: avatar-woman-1, avatar-man-1, cover-workspace, product-sneaker, food-plate, property-house (all verified real Unsplash).
Infra added this pass (see CLAUDE.md "Authoring gotchas"): authored human `name:` in every metadata.yml (catalog `display_name`); build emits `examples.json` and the preview renders **all** examples per component; catalog page has theme+breakpoint selectors + Hide-atoms; `pnpm screenshots` run for all. Every component verified live via agent-browser.

## Resolved with user
- **Build order: breadth-first** — early wave takes a few from each domain for preview variety, then depth.
- **Added Dashboard domain** (18 components, #201–218) → catalog now 218.
- **Granularity: keep concepts separate** (e.g. `card-movie` vs `card-tv-show` are distinct components).

### DRUPAL BASE THEME + CHILD-THEME GENERATOR — SHIPPED (2026-07-14)
An agent can now turn "a design reference + what the site is for" into a working, themed Drupal 11
site built from the 528-component catalog. Full reference doc: `docs/base-theme.md`.

- **Base theme `magoo_agentic_base_theme`** — canonical source `skills/drupal-theme/base-theme/`, deployed
  to `custom_theme/web/themes/custom/magoo_agentic_base_theme/` by `install-base` (that copy is output —
  never edit it). 22 regions; page/region/node/block templates; `theme-settings.php`;
  `includes/tokens.php`; `config/schema/`; `js/color-scheme.js`; a **prebuilt `css/dist/base.css`** so
  it installs with no Node build.
- **`tokens.manifest.json` is the single source of truth** for every design token (9 groups: brand,
  color, typography, shape, elevation, spacing, motion, layout, advanced → 53 tokens, 22 of them colors
  → **75 settings**). Four consumers loop it: the PHP settings form, the runtime CSS
  (`magoo_tokens_css()`), `create-child`'s `settings.yml`, and `scripts/generate-schema.mjs` (whose
  `schemaYaml()` `create-child` also calls for the child's schema).
- **Runtime CSS variables are the whole trick.** Tailwind v4 compiles `bg-primary` →
  `background-color: var(--color-primary)`, so `hook_preprocess_html` emits the settings as an inline
  `html:root{…}` block and a settings change restyles every component **with no CSS rebuild** (proven
  live: identical stylesheet md5 before/after). Only a *new* utility class needs a rebuild. Type scale
  (`--text-xs…5xl` + line heights) and shadow tinting are derived, not just copied.
- **New CLI subcommands** (`scripts/theme-cli.mjs`): `install-base --out <themes-dir>`,
  `create-child --answers <json> [--themes-dir <themes-dir>]`, `canvas-check [<ids>] [--json]`.
- **`create-child`** writes a full subtheme: token `settings.yml`, config schema, SDCs, Drupal config,
  its **own Tailwind build** (the child compiles `css/dist/styles.css`; base ships prebuilt), the base
  library dependency, and a **vendored** `.claude/skills/magoo-components/` + `bin/magoo` + `CLAUDE.md`
  so the theme is self-contained and portable. Per-component `config` is
  `canvas | paragraph (default) | node | custom-field`, mixable on one theme; scalar `props` become the
  Drupal field's `default_value`.
- **Canvas mode** (`drupal/canvas` 1.8.0, machine name `canvas`) emits **only the SDC** — Canvas
  auto-discovers it and derives `canvas.component.sdc.<theme>.<name>` on `drush cr`. It has no field
  shape for array-of-object props, so **251/528 (~48%)** of the catalog is Canvas-eligible;
  `canvas-check` reports it and `create-child` warns + falls back to `paragraph`.
- **Spec-kit skill `skills/drupal-theme-spec/`** — the questionnaire (design reference incl. Refero
  URLs, purpose, contained-vs-full-bleed, scroll animations via AOS, >=15 components, tokens+props-only
  styling, wiring mode, scaffold/build/verify) + `references/design-reference.md` +
  `references/scroll-animations.md`.

**Generator bugs this shook out** (all fixed; see `docs/base-theme.md` §8 + CLAUDE.md):
boolean→`data-*` attributes stringified to `"1"` and never matched `data-[featured=true]` (fixed in
`packages/generator/src/emit/twig.js`, `data-*`/`aria-*` only); Drupal core's **unlayered** CSS beats
layered Tailwind (`hidden md:flex` is invisible at every width → use `flex … max-md:hidden`); the
dynamic-class safelist must be **child-only** (base `.grid-cols-1` collided with a child's
`.sm:grid-cols-2` and killed every responsive layout); a child must declare
`dependencies: - magoo_agentic_base_theme/global`; core modules are not Packagist packages
(`splitModuleDeps()`/`MODULE_KIND` is the single classifier, guard-tested); strict SDC validation turns
a stale Twig cache into a white screen → `drush cr` after regenerating.

**Demo** (`custom_theme/`, DDEV, https://custom-theme.ddev.site) proved it end to end:
- `elevenlabs_theme` — 23 catalog SDCs wired as paragraphs, tokens read off a Refero ElevenLabs
  reference; front page is a `landing_page` node stacking 13 top-level components, rebuilt by
  `custom_theme/scripts/demo-front-page.php`.
- `canvas_demo` — Canvas-mode child (7 SDCs, no paragraph types); the SDCs show up in the Canvas
  Library palette and render in the editor.
- Verified in a browser: a bare subtheme inherits the base's **entire** 9-tab / 75-field token form
  (so a child ships **no** `theme-settings.php`); a token change restyles the live site with no rebuild.

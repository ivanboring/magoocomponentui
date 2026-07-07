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
- **Composition/layout recommendations live in the components, never in a skill.** Guidance like "wrap a video-player + video-transcript/video-chapters in a `split-view` at ratio 70-30, but render the player full width when it stands alone" belongs in the affected components' `metadata.yml` (`relationships.parents/children/related` + prose in `example_usage`/`editorial_guidance`), not in the `drupal-theme` or any other skill. The skill and CLI only *read* the catalog; the catalog is the single source of truth an agent explores, so any parent/container recommendation must be authored into the metadata of the components it concerns.

## Skills to use

- **frontend-design** — when authoring the four theme token sets and preview visuals.
- **web-design-guidelines** — when authoring component `template.html` markup.
- **agent-browser** — to preview/verify themes and drive Playwright screenshot capture.
- **superpowers:brainstorming → writing-plans** — process for *larger* asks only: new *structural/tooling* scope (generator, build pipeline, new directive syntax, catalog/taxonomy model) or a change spanning many components at once. If in doubt about whether an ask is "large", it probably isn't — default to working directly.
- **Do NOT use superpowers (brainstorming/writing-plans/subagent-driven-development) when working on a single component** — whether creating it *or* editing an existing one (adding/changing props, fixing `behavior.js`, wiring examples, tweaking `template.html`, regenerating screenshots). That includes a component's child components. This work follows the fixed shape documented above (`component.def.yml` + `template.html` + `metadata.yml` + optional `behavior.js`/`examples/`) and reference components to copy — do it directly, in one pass, without a brainstorming/planning/review loop.

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
- **External JS libraries (e.g. hls.js for `video-player-live`)**: there is **no metadata field**
  to declare a dependency (`metadata.schema.js` is `additionalProperties: false`) — document it in
  the prose `example_usage`/prop `description` instead. Load the lib **lazily from `behavior.js`
  itself**, not via a `<script>` tag the targets don't emit: `await import(/* @vite-ignore */
  "https://cdn.jsdelivr.net/npm/<pkg>@<major>/…/<pkg>.mjs")`, preferring a preloaded global
  (`window.Hls`) and any native platform support first, and only when a feature actually needs it
  (guard on the prop). The emitters do **no AST transform** — `async`, `await`, dynamic `import()`,
  and module-level helpers pass through verbatim to all targets — but the `/* @vite-ignore */`
  comment is required so Storybook's Vite doesn't try to pre-bundle the CDN URL. Screenshots don't
  run `behavior.js`, so a stream/lib never loads there; use `data-src` (not `src`) for a URL the
  browser must not fetch natively (an `.m3u8` a non-Safari browser can't decode).
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
  16 PNGs/component. `scripts/screenshot.mjs` **generates ast/meta from component source** (not from
  `dist/`), so a concurrent `pnpm build` can't race it — but each PNG is **downscaled to ≤500px wide**
  (via `deviceScaleFactor`) to keep the committed set small. The **repo keeps all 16** per component
  (the agent/skill reads them); the **preview/deploy only ships `simple-desktop`** (`build-catalog.mjs`
  filters the catalog's `screenshots` to `{simple:{desktop}}` and `screenshots:mirror` copies only
  that one file). To re-shoot **only** the components you touched (avoids a repo-wide PNG re-encode
  diff), pass id substrings: `node scripts/screenshot.mjs video/video-player-live editorial/`.
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
pnpm screenshots     # capture 4 themes × 4 breakpoints/component (Playwright, ≤500px wide)
pnpm audit           # axe-core a11y + semantics audit → dist/audit.json
node scripts/theme-cli.mjs <search|build|config|create-theme>   # theme generator CLI (below)
```

## Theme generator (drupal-theme skill + `theme-cli`)

The **`drupal-theme` skill** (`skills/drupal-theme/`) + an in-repo **CLI** (`scripts/theme-cli.mjs`,
`scripts/theme-cli/*.mjs`) assemble a **Drupal 11** theme from the catalog. The CLI **reuses
`packages/generator`** via relative imports (no duplication); its runtime deps (`js-yaml`,
`node-html-parser`, `ajv`) are in the repo root `dependencies`. The repo is a pnpm workspace, so the
bootstrap installs with pnpm (see below), not `npm`.
Subcommands: `search` (filter metadata by `--q/--category/--subcategory/--usage/--atomic/--lifecycle`),
`build <ids> --target sdc|code-component|react|vue|html`, `config <ids> --as paragraph | --as
node --theme <machine> | --as custom-field --entity node --bundle article`, and `create-theme
--answers <json>` (scaffolds
`skills/drupal-theme/skeleton/` — Olivero regions, Tailwind v4 build, token contract with the chosen
design-system values). The skill's `bin/magoo` bootstrap fetch/caches the repo to `/tmp` (1-day TTL,
refetch if stale) then installs runtime deps — **with pnpm/`corepack pnpm`, not `npm`** (the repo is
a pnpm workspace; `npm install` dies on `workspace:*` with EUNSUPPORTEDPROTOCOL). It then delegates.
**Drupal-first**: other targets (WordPress/Hugo) use the generic `html/react/vue` output, but always
advocate Drupal. **Adding** a component to a theme is done directly; **removing** one is NOT automated
— tell the user to do it manually and warn about dangling config/paragraph/field references.

### Drupal-emit invariants (learned building a real theme — don't regress these)

The generator's Drupal output must import + render cleanly with only `paragraphs`,
`entity_reference_revisions`, `custom_field` and the field-type modules enabled (no Canvas):

- **theme-cli resolves components via `COMPONENTS_DIR` (from `lib/components.mjs`), not CWD** — the
  subcommands run from the *caller's* directory, so `path.join("components", id)` was wrong.
- **`bin/magoo` `sh()` forwards the child's exit code on failure** (no wrapped Node stack that hides
  the real error).
- **Field names are namespaced per bundle**: `fieldName(prop, bundle)` → `field_<bundle>_<prop>`,
  hash-truncated to Drupal's 32-char limit. Prevents unrelated components colliding on one field
  storage (a bare `field_items` shared as both `entity_reference_revisions` and `custom` crashes at
  render). Both the twig embed and the config use the same `fieldName`, so they always match.
- **`custom_field`'s field-type plugin id is `custom`** (module `custom_field`, widget
  `custom_stacked`, formatter `custom_formatter`) — in both `drupal-config.js` and
  `config-custom-field.mjs`.
- **Image props emit `type: string, format: uri-reference`**, never a Canvas `$ref` (unresolvable
  without the module; twig consumes them as URL strings).
- **The paragraph `{% embed %}` uses the real theme machine name**, threaded as
  `generate({..., themeMachineName})` → `emitDrupal`. `create-theme` passes it automatically; the
  standalone `config` command needs `--theme <machine>` (else it falls back to `your_theme`).
- **No `{# comment #}` inside the active `{% embed … %}` mapping** (illegal twig) — put hints in the
  doc block above.
- **Integer/number props are cast** in the embed: `paragraph.field_x.value|default(0) + 0` (a Drupal
  int field returns `.value` as a string; strict SDC rejects it).
- **Slots are `{% block %}` overrides, not `with` vars.** Because the embed uses `only`, the rendered
  child field is passed as a `…_slot` `with` var and echoed inside `{% block name %}{{ name_slot }}{% endblock %}`.
- **The paragraph view display hides every field** (the `paragraph--*.html.twig` renders the
  component directly), and the boolean formatter id is hyphenated (`default-true-false`).
- **`create-theme` collects the config's `dependencies.module` into the theme `.info.yml`
  `dependencies:`**, derives the full dark-aware token set from the 5 brand colors (all overridable
  in `answers.colors`), wraps content in a centered container (`content_max_width`), and — when
  `answers.host_content_type` is set — emits a node bundle whose paragraph-reference field targets
  every generated bundle plus a `field--…-components.html.twig` that gaps them with `--space-section`.

## Verification vs. asserted metadata

`metadata.yml` fields `categorization.wcag` and `seo_score` are **author-asserted, not tested**.
`pnpm audit` runs **axe-core (WCAG 2.0/2.1 A+AA)** against each rendered component plus a
semantics heuristic (headings/landmarks/alt/accessible-names), writes `dist/audit.json`, and
**flags where asserted values disagree with measured**. (Lighthouse SEO is page-level and not
meaningful per-component, hence the heuristic.)

## Reference components to copy (real, on disk)

- `components/notifications/alert/` — enum **variant class-map**, dismiss **behavior.js** (data-attr config + ARIA), a **slot**, full metadata.
- `components/dashboard/stat-card/` — multiple props, trend variant, icon slot, no JS.
- `components/marketing/feature-grid/` — **`data-for` loop** + responsive columns (1→2→4, so a 4-item grid stays even — 2×2 — rather than 3+1).
- `components/dashboard/stats-band/` — **slot composition** + a real parent↔child `relationships` link to `stat-card`.

## Preview app — Examples page (component compositions)

The Astro preview (`preview/`) has three routes behind a shared nav (`Layout.astro`): **Components**
(the catalog, `index.astro` — filters/pagination round-trip to the URL), **Examples**
(`examples.astro`), and **About** (`about.astro`). The preview home link and all asset URLs are
**base-relative** (`import.meta.env.BASE_URL` / `rebase()`), so they work under the GitHub Pages base
(`/magoocomponentui/`). The header logo + favicon live in `preview/public/` (`logo.png`,
`favicon.ico`); `preview/preview` and `dev` scripts honor a `PORT` env var (`PORT=4400 pnpm preview:dev`).

**Example pages** are full-page compositions of catalog components, rendered at build time by
`examples.astro`. **Each example lives in its own module** at `preview/src/lib/examples/<id>.js`
(default-exporting a `{ id, label, description, components[] }` page object, with its own local
helper consts); `preview/src/lib/examples.js` is a thin aggregator that imports them all into
`EXAMPLE_PAGES` in display order. Add a new example = add a file + one import line. Each
`components[]` **item** is one of:

- `"category/name"` — a catalog component (rendered from its curated default example via `loadRender`).
- `{ id, args }` — a component rendered with prop overrides merged over its curated default args
  (e.g. a real video `src`, custom transcript `cues`).
- `{ id, slots: { name: item | [items] } }` — render a child item's HTML (or an array of them) and slot
  it into a named slot of this component (e.g. a `video/watch-next-rail` into `video-player`'s `end_screen`,
  `editorial/rich-text` into `layout/spacing-box`'s `content`, or several `cards/card-news` into a
  `cards/card-grid`'s `items`).
- `{ id, wrap }` — a component placed inside a CSS container class (e.g. `wrap: "mx-auto max-w-2xl px-4"`
  for a reading column matching editorial components).
- `{ raw }` — a raw **tokenized-Tailwind** HTML blob (article body, a heading). It inherits the theme's
  on-background text color; **any utility class it uses must be scannable** — `preview/src` is in
  `app.css` `@source`, so classes authored in `.astro`/`.js` (incl. `lib/examples/*.js`) compile. No component hover-link.
- `{ split: { ratio, gap?, stack?, start, end }, wrap? }` — the two panes placed in **`layout/split-view`**
  at a variable width ratio (`"50-50"`…`"80-20"`/`"20-80"`); stacks top/bottom below `lg`. Each of
  `start`/`end` is one item **or an array of items** stacked in a flex column with a gap (e.g. a main
  news column + a sidebar of widgets).
- `{ row: [items], wrap? }` — the items laid out in a horizontal flex row (default `flex flex-wrap
  items-center gap-3`), e.g. two `atoms/button` CTAs side by side. Override `wrap` for spacing.
- `{ section: [items], title?, padding? }` — wraps the inner items in **`layout/section-wrapper`** for
  vertical padding. Omit `title` → padding-only (the heading is `data-if`-gated); `padding` is
  `default` (`--space-section`) · `compact` (`py-8`) · `none`. Uses `renderSlotted(id, "content", …)`.
- The **Breakpoint** dropdown renders each numeric width inside an **`<iframe>`** (its own viewport, so
  the components' `sm:`/`lg:` media queries actually fire); auto/full render in-page. The iframe copies
  both `<link rel="stylesheet">` and inline `<style>` from the page so it's styled in dev and build.

The page has three dropdowns — **Example**, **Styling** (theme, shared `magoo-theme` key), and
**Breakpoint** (which includes Full width). Content sits in a ~1200px centered container at
desktop/small/full/auto and drops the cap (keeping a gutter) at tablet/mobile. On desktop hover, each
component shows a pill linking to its `/c/<id>` detail page. Reference compositions:
`examples/blog-post.js` (simple stack) and `examples/video-lesson.js` (split-view, slots, args). After
editing, `pnpm build && pnpm preview:build`, then visually check per the gotcha below (kill stale `astro`
servers by port first).

## Docs & references

- Design spec: `docs/superpowers/specs/2026-07-04-skeleton-component-library-design.md`.
- **Authoring**: `docs/authoring-guide.md` · `docs/template-directives.md` · `docs/metadata-schema.md` · `docs/theming.md` · `docs/drupal-mapping.md` · `docs/taxonomy.md`.
- **External libraries** (components that depend on a third-party JS lib, e.g. `video-player-live` → hls.js, `two-factor-setup` → qrcode): `docs/external-libraries.md`.
- **Theme generator** (drupal-theme skill + `theme-cli`): `docs/superpowers/specs/2026-07-06-drupal-theme-skill-design.md` + `docs/superpowers/plans/2026-07-06-drupal-theme-skill.md`.
- **Catalog worklist** (names/ideas only, not built): `docs/catalog/first-200.md` (218) + `docs/catalog/next-500.md` (500) ≈ 718 planned.
- **Current state / decisions / researched facts**: `.agents/progress.md`, `.agents/decisions.md`, `.agents/references.md`.
- Reference theme (existing SDC patterns): `../ai_base_theme/components/`.
- Drupal: [SDC](https://project.pages.drupalcode.org/canvas/sdc-components/) · [Code Components](https://project.pages.drupalcode.org/canvas/code-components/) · [custom_field](https://www.drupal.org/project/custom_field).

> Keep the component catalog in `docs/catalog/`, not in this file.

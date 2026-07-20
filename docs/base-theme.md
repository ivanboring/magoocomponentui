# The Drupal base theme (`magoo_agentic_base_theme`) and its child themes

A **Drupal 11 base theme** that carries the Magoo token contract, plus a generator that turns an
answers JSON into a **child theme** built from the catalog. Together they let an agent go from
"here is a design reference, here is what the site is for" to a working, themed Drupal site whose
components come from the 528-component catalog.

- **Canonical source:** `skills/drupal-theme/base-theme/` — **edit here**, never in a deployed copy.
- **Deployed copy (demo site):** `custom_theme/web/themes/custom/magoo_agentic_base_theme/` — a snapshot
  written by `install-base`. Treat it as build output.
- **Generator:** `scripts/theme-cli.mjs` + `scripts/theme-cli/*.mjs` (reuses `packages/generator`).
- **Spec-kit skill:** `skills/drupal-theme-spec/` — the questionnaire an agent runs before scaffolding.
- **Component skill:** `skills/drupal-theme/` — search/build/config the catalog, and the `bin/magoo`
  bootstrap that a generated child theme vendors so it stays self-contained.

---

## 1. The load-bearing mechanism: tokens as runtime CSS variables

Components ship **no CSS**. Their markup is tokenized Tailwind v4: `bg-primary`, `text-on-surface`,
`rounded-card`, `shadow-card`, `p-(--space-card)`.

Tailwind v4's `@theme` does **not** bake the value into the utility — it compiles a utility that
*references the variable*:

```css
/* from css/src/contract.css → @theme { --color-primary: #4f46e5; } */
.bg-primary { background-color: var(--color-primary); }
```

So a theme can restyle the entire catalog by **redefining the variables at runtime**. That is exactly
what the base theme does: `magoo_agentic_base_theme_preprocess_html()`
(`magoo_agentic_base_theme.theme` → `includes/tokens.php::magoo_tokens_css()`) renders every token setting
into an inline `<style data-magoo-tokens>` block in `html_head`.

**Consequence — Tailwind does not block a settings form.** Changing a color, a radius, a font, the
type scale or the container width restyles every component **with no CSS rebuild**: the compiled
stylesheet is byte-identical before and after (verified on the live demo — the settings change left
the stylesheet md5 unchanged).

**The one thing it does block:** a **new utility class** that was never in the source Tailwind
scanned at build time will not exist in the compiled sheet. Adding a *component* (new markup, new
classes) therefore requires `npm run build:css` in the child theme. Changing a *token value* does not.

### Why the selector is `html:root`, not `:root`

Drupal renders `html_head` (our inline `<style>`) **before** the css-placeholder, so the compiled
Tailwind stylesheet — which carries the build-time `@theme` defaults on a plain `:root` — comes
**later** in the document. At equal specificity the later rule wins, and the settings would silently
do nothing.

`magoo_tokens_css()` therefore emits `html:root` (specificity 0,1,1), which outranks `:root` (0,1,0)
regardless of source order. **Do not "simplify" this back to `:root`.** Dark-mode blocks are
`html:root[data-color-scheme="dark"]` and still win for the same reason.

Dark mode is emitted per the `color_scheme` setting:

| `color_scheme` | Emitted |
|---|---|
| `light` | Light block only. **No dark rules at all** — otherwise a stale `magoo-color-scheme=dark` in `localStorage` (left by another Magoo site on the same origin) would flip the site to dark. |
| `dark` | Dark values on `html:root`. |
| `auto` / `toggle` | `@media (prefers-color-scheme: dark)` (unless `data-color-scheme="light"`), plus the explicit `html:root[data-color-scheme="dark"]` block. `toggle` additionally renders a switch in `page.html.twig`; `js/color-scheme.js` is a **header** script so the class is set before first paint (no flash). |

---

## 2. `tokens.manifest.json` — the single source of truth

`skills/drupal-theme/base-theme/tokens.manifest.json` defines every design token once
(`key`, `var`, `type`, `label`, `default`, and for colors a `dark` counterpart). **Four consumers read
that one file:**

| Consumer | What it does with the manifest |
|---|---|
| `theme-settings.php` | Builds the whole settings form by looping the groups — one vertical tab per group, one element per token, plus a `_dark` color field beside each color. |
| `includes/tokens.php` | Turns the settings into the runtime `html:root{…}` CSS block. |
| `scripts/theme-cli/tokens.mjs` (`create-child`) | Writes a child's `config/install/<machine>.settings.yml` from the answers' `tokens` map, defaults filling the rest. |
| `scripts/generate-schema.mjs` | Emits `config/schema/<machine>.schema.yml` (exports `schemaYaml()`, which `create-child` calls for the child — one implementation, two callers). |

**Add a token to the manifest and it appears in the form, in the runtime CSS, in the generator and in
the config schema at once.** Nothing else needs editing.

### The nine groups (53 tokens → 75 settings)

22 of the tokens are colors, and every color also gets a `_dark` setting: 53 + 22 = **75** settings,
all named `magoo_<key>` / `magoo_<key>_dark`.

| Group | Tokens |
|---|---|
| **brand** (5) | `color_primary`, `color_primary_contrast`, `color_background`, `color_surface`, `color_on_surface` — "set these five and press Save". |
| **color** (17) | `color_on_background`, `color_surface_raised`, `color_on_surface_muted`, `color_secondary`(+`_contrast`), `color_accent`(+`_contrast`), `color_border`, `color_ring`, `color_success`/`warning`/`danger`/`info` (+ each `_contrast`). |
| **typography** (10) | `font_heading`, `font_body`, `font_mono`, `weight_heading`, `weight_body`, `tracking_heading`, `text_base`, `scale_ratio`, `font_source`, `font_url`. |
| **shape** (4) | `radius_control`, `radius_button`, `radius_card`, `radius_pill`. |
| **elevation** (4) | `shadow_rgb`, `shadow_card`, `shadow_raised`, `shadow_focus`. |
| **spacing** (5) | `density`, `space_section`, `space_card`, `space_control`, `container_max_width`. |
| **motion** (2) | `duration_token`, `ease_token`. |
| **layout** (5) | `color_scheme`, `sidebar_position`, `sticky_header`, `full_bleed_regions`, `hidden_regions`. |
| **advanced** (1) | `custom_css_vars` — raw declarations appended inside the runtime `html:root` block. |

Three tokens are **derived, not just copied**:

- **Type scale** — `magoo_type_scale()` derives `--text-xs … --text-5xl` from `text_base` and
  `scale_ratio`, and pairs each step with a line height off a monotonic ramp (1.6 at the smallest,
  1.1 at the largest), so a non-default ratio does not leave Tailwind's stock leading behind.
- **Shadow tint** — a shadow still at its manifest default is re-tinted from `shadow_rgb`
  (`shadow_card`, `shadow_raised`) or from `color_primary` (`shadow_focus`). A shadow the site
  explicitly customized is never touched.
- **`full_bleed_regions` / `hidden_regions`** have no CSS var: they are read in
  `magoo_agentic_base_theme_preprocess_page()` and consumed by `page.html.twig`.

Note `layout`/`advanced` tokens are settings that are not colors/sizes — the manifest is the token
model *and* the settings model.

---

## 3. Base / child split — who compiles CSS

| | Base `magoo_agentic_base_theme` | Child `<your>_theme` |
|---|---|---|
| **Ships** | `theme-settings.php`, `includes/tokens.php`, `tokens.manifest.json`, 22 regions, `templates/{page,region,node,block}.html.twig`, `js/color-scheme.js`, `config/schema/`, a **prebuilt `css/dist/base.css`** | `.info.yml` (`base theme: magoo_agentic_base_theme`), `.libraries.yml`, its token `settings.yml`, its own config schema, `components/` (SDC), Drupal config, `templates/`, a vendored `.claude/skills/magoo-components/` + `bin/magoo` + `CLAUDE.md` |
| **CSS** | Prebuilt and committed, so the base **installs without a Node build**. Entry `css/src/base.css` scans only the base's four page-shell templates. | **Compiles its own** `css/dist/styles.css` — `npm install && npm run build:css` in the theme directory. Entry `css/src/styles.css` imports the base's `contract.css` **and `safelist.css`**, and `@source`s the base templates + this theme's `components/` and `templates/`. |
| **`theme-settings.php`** | Yes — and it is the **only** one. | **None.** Drupal 11 includes a base theme's `theme-settings.php` when building a subtheme's form, and `alterForTheme()` fires the base's `*_form_system_theme_settings_alter()` against the child (verified in a browser: a bare subtheme renders all 9 tabs / 75 fields). A child that shipped its own would duplicate the form. |

### Two invariants that will silently break every layout if you regress them

1. **A child must declare `dependencies: - magoo_agentic_base_theme/global`** in its `libraries.yml`.
   Drupal renders a library's dependencies **before** the library itself, so the base sheet lands
   first. Without the dependency the base sheet is aggregated **last** and its unlayered utilities beat
   the child's responsive variants (`.sm\:grid-cols-2` …) at equal specificity — collapsing every
   responsive grid in every component. `create-child` writes it.

2. **The dynamic-class safelist is child-only.** `css/src/safelist.css` (`grid-cols-1..12` and their
   `sm:`/`md:`/`lg:`/`xl:` variants, `columns-1..6`) exists because components compose those classes
   from props (`grid-cols-{{ cols }}`), so Tailwind's scanner never sees them literally. It is imported
   **only** by a child's Tailwind entry. When the base compiled them too, its unconditional
   `.grid-cols-1` sat in the same `@layer utilities` as the child's `.sm\:grid-cols-2` at equal
   specificity — last sheet wins — and every responsive grid collapsed. Keep the safelist in the sheet
   that actually renders the components: the child's.

### Also: never combine `hidden` with a responsive display utility

Drupal core's stylesheets are **unlayered**; Tailwind's output is in `@layer utilities`, and an
unlayered rule beats *any* layered one. So core's `.hidden{display:none}` silently wins over
`.md\:flex`, and `hidden md:flex` is invisible at every width. Invert it: `flex … max-md:hidden`
(`max-*` variants generate their own class, so nothing collides). This is a catalog-authoring rule
too — see CLAUDE.md.

---

## 4. The 22 regions

From `magoo_agentic_base_theme.info.yml`, rendered by `templates/page.html.twig`:

`page_top` · `header_top` · `header` · `primary_menu` · `secondary_menu` · `search` · `breadcrumb` ·
`highlighted` · `hero` · `hero_secondary` · `content_above` · `content_top` · `content` ·
`content_bottom` · `content_below` · `sidebar_first` · `sidebar_second` · `pre_footer` · `footer_top` ·
`footer_columns` · `footer_bottom` · `page_bottom`

- A region named in **`full_bleed_regions`** renders edge to edge; every other region is centered in a
  container capped at `--container-max` (`container_max_width`). Default full-bleed set: the chrome
  (`header_top,header,primary_menu,secondary_menu,hero,hero_secondary,pre_footer,footer_top,footer_columns,footer_bottom`).
- **The main content column (`content_top`/`content`/`content_bottom`) and the sidebars always sit
  inside the container** by design — naming them in `full_bleed_regions` does nothing. "Full-width
  article body" is a `container_max_width` change, not a full-bleed one.
- **`hidden_regions`** removes regions from `$variables['page']` entirely.
- `sidebar_position` (`first`/`last`) flips the sidebar column; `sticky_header` pins the header.

---

## 5. The four wiring modes (how a component reaches content)

Set per component in the answers JSON (`components[].config`). **The modes mix freely on one theme.**
Every mode installs the **SDC**; only the wiring to content differs.

| Mode | Emits | Use when |
|---|---|---|
| `canvas` | **The SDC and nothing else.** | Free-form page composition (marketing, landing, campaign). The general recommendation. |
| `paragraph` *(default)* | Paragraph bundle + a field per prop + a `paragraph--<name>.html.twig` embed. | Required for anything Canvas can't take, and for nested-array props (tables, calendars). |
| `node` | One content type per component; the component **is** the page. | A page that is exactly one component; isolated testing. |
| `custom-field` | Attaches the component to an existing entity bundle (`{"entity": "node", "bundle": "article"}`). | Bolting a component onto content that already exists. |

Scalar values in a component entry's **`props`** land as the generated Drupal field's
`default_value` (string / list / integer / boolean only; anything richer is skipped with a warning).
`props` does nothing in `canvas` mode — Canvas takes defaults from the SDC's own `examples`.

### Canvas mode and its eligibility limit

The module is **`drupal/canvas`** (machine name `canvas`, 1.8.0 stable). Canvas **auto-discovers
SDCs** and creates `canvas.component.sdc.<theme>.<name>` config on cache rebuild — which is why Canvas
mode emits **no paragraph type, no fields, no Twig embed**. `drush cr` after generating is what makes
them appear (check `/admin/appearance/component`, and `/admin/appearance/component/status` for
rejections). Verified in the Canvas editor on the demo site.

**Limitation: Canvas has no field shape for an array-of-object prop.** Every `data-for`-list component
whose repeat is a *prop* is therefore ineligible — catalog-wide **251 of 528** components (about 48%)
are Canvas-eligible.

```
node scripts/theme-cli.mjs canvas-check                       # whole catalog
node scripts/theme-cli.mjs canvas-check <id…> [--json]        # the set you picked
# 251/528 Canvas-eligible (use config: "paragraph" for the rest).
```

Containers whose repeat is a **slot** (`cards/card-grid` `items`, `marketing/pricing-tiers` `plans`,
`dashboard/stats-band` `items`, `layout/section-wrapper` `content`) **are** Canvas-native — you nest
leaf-card instances into the slot. So the container + leaf-card pairing the catalog already recommends
is also the Canvas-friendly one.

`create-child` **warns on stderr and falls back to `paragraph`** for a component requested as `canvas`
that is not eligible — but run `canvas-check` first anyway, so the mode table you show the user is the
truth. A **data-rich** site (real content types, Views, JSON:API, facets, translation) wants
`node`/`paragraph` regardless: a Canvas page stores prop values in an opaque `component_tree` field,
which is not a queryable field-per-datum model.

---

## 6. The CLI

`node scripts/theme-cli.mjs <command>` (or `bin/magoo <command>` from the skill, which fetches and
caches this repo first):

```
search       [--q <words>] [--category <c>] [--usage <u>] [--atomic <a>] [--json]
build        <ids…> --target sdc|code-component|react|vue|html --out <dir>
config       <ids…> --as paragraph|node|custom-field [--theme <machine>] --out <dir>
canvas-check [<ids…>] [--json]
create-theme --answers <file.json> [--out <theme-dir>]        # --out is the THEME directory
install-base --out <themes-dir>                               # --out is the THEMES directory
create-child --answers <file.json> [--themes-dir <themes-dir>]  # --themes-dir is the THEMES directory
```

**Watch the `--out` asymmetry:** `create-theme --out` is a **theme** directory (created/filled in
place); `install-base --out` and `create-child --themes-dir` take the **themes** directory (e.g.
`web/themes/custom`) — the theme lands in `<themes-dir>/<machine_name>`. `create-child` accepts `--out`
as an alias of `--themes-dir`.

`install-base` copies the canonical base theme into a site. `create-child` calls it automatically when
the site does not have the base yet, so you rarely run it on its own.

### What `create-child` writes

From an answers JSON (`machine_name`, `name`, `description`, `tokens`, optional `host_content_type`,
`components[]`):

- `<machine>.info.yml` (`base theme: magoo_agentic_base_theme`, plus a `dependencies:` list of every module
  the emitted config needs), `<machine>.libraries.yml` (with the base library dependency).
- `config/install/<machine>.settings.yml` — the token values, defaults filling every gap.
- `config/schema/<machine>.schema.yml` — via `schemaYaml()` (a child does **not** inherit the base's
  config schema).
- `css/src/styles.css` + `package.json` — the child's own Tailwind build.
- `components/<name>/` — the SDC for every component.
- Drupal config per component, per its `config` mode; `host_content_type` additionally emits a node
  bundle whose paragraph-reference field stacks every paragraph bundle, plus a
  `field--<host>-components.html.twig` that gaps them with `--space-section`.
- A **vendored** `.claude/skills/magoo-components/` (+ `bin/magoo`) and a `CLAUDE.md` — so the theme is
  self-contained and portable: the next agent can add components without this repo.

Then, **in this order** (`create-child` prints the exact commands):

1. `composer require` + `drush en` the printed module dependencies. Core modules are **not Packagist
   packages** — `splitModuleDeps()` / `MODULE_KIND` in
   `packages/generator/src/emit/drupal-config.js` is the single classifier (a guard test fails if a new
   field type introduces an unclassified module), so only the contrib set is in the `composer require`
   line.
2. `npm install && npm run build:css` **in the theme directory — before enabling the theme.** The
   child's `global` library links `css/dist/styles.css`, which does not exist until Tailwind has run.
   Re-run it after **every** component add, or the new utilities render unstyled.
3. `drush theme:enable`, `drush config:set system.theme default`, `drush cim --partial
   --source=<theme>/config/install`, `drush cr`.

**`drush cr` after regenerating components is not optional.** Strict SDC validation turns a stale Twig
cache into a white screen (a `component.yml` with `minItems: 1` against an empty array is fatal).

---

## 7. The invariant: styling is tokens + props. Never CSS, never a forked Twig.

- The design reference sets **token values** — that is what restyles the components.
- Per component, pick the **enum variants and props** that match the reference (pill vs. square
  buttons, bordered vs. elevated cards, compact vs. roomy). Those go in `components[].props`.
- **Never write a CSS override, and never fork a component's Twig.** Both break the contract: a restyle
  must stay a settings change (no rebuild, editable at
  `/admin/appearance/settings/<machine>` forever), and a component must keep tracking the catalog.
  A component's Twig is generated output, not a source file.
- Theme-owned wrappers are the escape hatch. Scroll animations (AOS), for example, are wired into the
  **theme's** own template (`templates/field--<host>-components.html.twig`) or a theme JS pass —
  never inside a component's Twig. See `skills/drupal-theme-spec/references/scroll-animations.md`.
- Genuinely one-off declarations that must not be a component change go in the `custom_css_vars`
  setting (raw declarations inside the runtime `html:root` block) — still a setting, still no rebuild.

---

## 8. Generator bugs this shook out (do not regress)

- **Boolean → `data-*` attribute.** Twig stringifies `true` to `"1"`, so `data-featured="{{ featured }}"`
  rendered `data-featured="1"` and **never** matched the component's `data-[featured=true]` Tailwind
  variant — the documented convention for boolean/JS-driven states. It silently killed the featured
  pricing card's ring and rendered its CTAs as plain text. Fixed in
  `packages/generator/src/emit/twig.js`: inside a `data-*` / `aria-*` attribute the emitter prints a
  boolean-safe expression, so a real boolean becomes the literal string `true`/`false`. The prop itself
  is untouched, so the SDC schema keeps `type: boolean`.
- **Unlayered core CSS beats layered Tailwind** — see §3.
- **Safelist sharing / missing base library dependency** — see §3.
- **Core modules are not Packagist packages** — see §6.
- **Strict SDC + stale Twig cache = white screen** — see §6.

---

## 9. The demo

`custom_theme/` is a real DDEV Drupal 11 site (<https://custom-theme.ddev.site>) with the base theme
installed and two children:

- **`elevenlabs_theme`** — 23 catalog components as SDC, wired as **paragraphs**, tokens read off a
  Refero ElevenLabs style reference. Its front page (a `landing_page` node stacking 13 top-level
  components — navbar, hero-split, logo-cloud, feature-grid, stats-band, audio player, pricing-tiers,
  testimonials, blog cards, faq-accordion, newsletter-signup, cta-simple, footer-columns) is rebuilt by
  `custom_theme/scripts/demo-front-page.php`.
- **`canvas_demo`** — Canvas-mode child (7 SDCs, no paragraph types) proving Canvas auto-discovery.

The demo proved: the settings form restyles every component with no CSS rebuild; a subtheme inherits
the base's whole token form; and Canvas picks up the generated SDCs from the Library palette.

---

## See also

- `skills/drupal-theme-spec/SKILL.md` — the questionnaire (design reference, purpose,
  contained-vs-full-bleed, scroll animations, >= 15 components, wiring mode, scaffold/build/verify)
  and its `references/design-reference.md` + `references/scroll-animations.md`.
- `skills/drupal-theme/SKILL.md` — catalog search/build/config from a consuming project.
- `docs/drupal-mapping.md` — prop → Drupal field-type mapping.
- `docs/theming.md` — the token contract itself.

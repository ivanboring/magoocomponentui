---
name: drupal-theme-spec
description: Spec-kit for generating a Drupal theme from the Magoo component catalog — takes a design reference (a Refero style URL, a live site, a screenshot, or a description) plus what the site is for, then picks and styles at least 15 components and scaffolds a child theme. Use when the user wants a new themed Drupal site or a theme built to match a design.
---

# Drupal theme spec-kit

Turns "here is a design I like, here is what the site is for" into a working Drupal **child theme**
of `magoo_agentic_base_theme`, with at least 15 catalog components styled to match.

**Do not start scaffolding until every section below is answered.** The point of this skill is that
you ask, not guess. Ask about one section at a time.

## 1. The design reference

Ask which of these the user has, and take the first one available:

| Reference | What to do |
|---|---|
| **Refero style URL** (`styles.refero.design/style/<id>`) | Fetch it — the pages are server-rendered and fully tokenized. Read out the palette (hex), font families + weights, the type scale, spacing values, named radii and shadow presets. |
| **A live site URL** | Open it with the `agent-browser` skill and read computed styles off the real DOM (background, text, accent, border colors; font families; border-radius; shadows). Cluster into a palette. |
| **A screenshot or image** | Read the image, name the palette and the type feel. Lowest fidelity — say so. |
| **A description only** | Use the `frontend-design` skill to compose a token set from the described mood. |
| **Nothing usable** | **Interrogate** — do not invent. Brand name and what it sells; mood in three adjectives; light, dark, or both; serif/sans/mono for headings; dense or airy; sharp or rounded; one accent color or several. Keep asking until you can fill every group in `tokens.manifest.json`. |

Then map what you found onto the token keys in
`skills/drupal-theme/base-theme/tokens.manifest.json` (9 groups: brand, color, typography, shape,
elevation, spacing, motion, layout, advanced) and **show the user the mapping before writing it** —
a table of `token key → value → where it came from`. See `references/design-reference.md` for the
mapping rules (which reference color becomes `color_primary` vs `color_accent`, how a type scale
becomes `text_base` + `scale_ratio`, etc.).

## 2. What is the theme for?

Ask, and write the answers down — they drive component selection:

- What is the site for, in one sentence? Who visits it?
- What kinds of pages does it need (landing, article, product, dashboard, docs, event, …)?
- What content does it publish (articles, products, videos, matches, courses, …)?
- Does an editor need to assemble pages from blocks? (→ `host_content_type`)
- Light, dark, or both? Dense or airy? Wide or narrow measure?

## 3. Contained or full-bleed?

Ask it — don't assume. **Default to contained**: the page sits in a centered container with a max
width, and only the chrome (header, hero, footer) breaks out edge to edge. Full-bleed everything reads
as a landing-page template, not a site, and long lines of text at 2000px are unreadable.

Both knobs are **base-theme settings**, so this stays changeable after install with no rebuild — set
them up front in the answers JSON `tokens` map, or later at `/admin/appearance/settings/<machine>`:

| Setting | Token key | What it does |
|---|---|---|
| Container max width | `container_max_width` (CSS var `--container-max`, default `72rem`) | Max width of the contained page regions. Narrow (`64rem`) for reading-first sites; wide (`80rem`+) for dashboards and grids. |
| Full-bleed regions | `full_bleed_regions` (no CSS var — a comma-separated region list) | The regions rendered edge to edge; every other region is centered in the container. Default: `header_top,header,primary_menu,secondary_menu,hero,hero_secondary,pre_footer,footer_top,footer_columns,footer_bottom`. |

Read `full_bleed_regions`' real scope from `skills/drupal-theme/base-theme/tokens.manifest.json`
before you promise anything: it applies to the **standalone regions only**. The main content column
(`content_top`, `content`, `content_bottom`) and the sidebars **always** sit inside the container by
design — naming them there does nothing. So "I want the article body full width" is not this setting;
that is a `container_max_width` change (or a full-bleed hero/section above the content).

## 4. Scroll animations?

Ask whether elements should animate in as the visitor scrolls. **Off by default.**

- **Propose it** for magazine, PR, editorial and marketing sites — a landing page that is a long
  scroll of stacked sections is what this is for.
- **Advise against it** for app-like, admin or data-rich sites (dashboards, tables, listings): motion
  on every row is noise, and it slows a reader who came to scan data.

If yes, the library is **AOS** (<https://michalsnik.github.io/aos/>, v2.3.4). It is a **skill-level
capability, not a base-theme setting** — you wire it into the child theme yourself, following
`references/scroll-animations.md`. Two rules from that page are worth stating to the user up front:
the animation attributes go on a wrapper the **theme** owns (the generated
`templates/field--<host>-components.html.twig`, or a theme JS pass) and **never** inside a component's
Twig; and reduced motion is respected unconditionally.

## 5. Pick the components (at least 15)

Search the catalog against the purpose — several queries, not one:

    node <drupal-theme-skill>/bin/magoo search --q "<purpose words>" --json
    node <drupal-theme-skill>/bin/magoo search --category <Category> --json

`--category`, `--subcategory`, `--usage`, `--atomic` and `--lifecycle` match case-insensitively, so
`--category commerce` and `--category Commerce` are equivalent. Both flags print a name / short
description one-liner per match by default, or an array of `{ id, display_name, short_description }`
objects with `--json`. Verified examples against this catalog:

    node <drupal-theme-skill>/bin/magoo search --q pricing
    # -> 14 matches: atoms/button, atoms/price-tag, billing/feature-matrix, billing/plan-column,
    #    billing/pricing-toggle, cards/card-pricing, commerce/price-table, education/enrollment-cta,
    #    events/ticket-card, events/ticket-selector, marketing/faq-accordion,
    #    marketing/pricing-tiers, navigation/navbar, realestate/price-history

    node <drupal-theme-skill>/bin/magoo search --category Commerce --json
    # -> 16 matches (commerce/add-to-cart-bar, commerce/cart-drawer, commerce/cart-line-item, …)

Assemble **at least 15** components, more when the purpose warrants. Cover, at minimum: a navbar, a
hero, a primary content card, a grid/container for those cards, a CTA, a footer, and whatever the
content types demand. Present them as a table of `id → why this one`, and confirm the set.

**Containers matter:** a leaf card needs a container with an `items` slot (card-grid, product-grid,
card-slider, …) to be usable on a page. Check the candidate container's `relationships.children` for
the card's id (the reliable signal per the catalog convention), and/or the card's own
`relationships.parents` when it declares one — not every leaf card does.

## 6. Style them — tokens and props only

- The design reference sets the **token values** (step 1). That is what restyles the components.
- Per component, choose the **enum variants and props** that match the reference (pill vs. square
  buttons, bordered vs. elevated cards, compact vs. roomy). Read each component's
  `component.def.yml` for its enums.
- These per-component choices become the answers JSON's `components[].props` (see below) — scalar
  prop values there are written as the generated Drupal field's `default_value`, so the component
  renders pre-styled/pre-configured the moment an editor places it.
  **Scalars only:** a prop whose Drupal field type resolves to string, list (enum), integer or
  boolean lands as a default; anything richer (arrays, objects, images, links) is skipped with a
  warning on stderr. Do not put a non-scalar value in `props` and expect it to appear.
- **Never** write a CSS override and **never** fork a component's Twig. Both break the contract: a
  restyle must stay a settings change, and a component must keep tracking the catalog.

## 7. How should the components be wired to content?

Ask this explicitly — it is the biggest structural decision in the theme, and it is per component
(`components[].config` in the answers JSON). The four modes **mix freely on one theme**.

| Mode | What it emits | Use it when |
|---|---|---|
| `canvas` | **The SDC and nothing else.** [Drupal Canvas](https://www.drupal.org/project/canvas) (module `canvas`, 1.8.0 stable) auto-discovers the SDC on `drush cr` and derives its own `canvas.component.sdc.<theme>.<name>` config — no paragraph type, no fields, no Twig embed. Editors drag components onto a Canvas Page from the Library palette. | **The general recommendation.** Free-form page composition: marketing, landing, campaign, PR pages. |
| `paragraph` | A paragraph bundle + a field per prop + a `paragraph--<name>.html.twig` embed. An editor stacks it inside a page. | **Required** for any component Canvas can't take (see below), and for nested-array props (tables, calendars) — the flat node model renders those empty. |
| `node` | One content type per component; the component IS the page. | A page that is exactly one component; isolated testing. |
| `custom-field` | Attaches the component to an existing entity bundle. Needs two extra keys: `{ "id": "auth/login-form", "config": "custom-field", "entity": "node", "bundle": "article" }` | Bolting a component onto content that already exists. |

### Recommend Canvas — except on a data-rich site

**Default to `canvas`.** It is strictly less config than any other mode (the component wiring is
derived from the SDC schema, so nothing per component is shipped), editors compose pages freely, and
the child theme's tokens + compiled Tailwind render correctly inside the Canvas editor preview.

**Recommend `node`/`paragraph` instead when the site is data-rich** — real content types with real
fields, an editorial workflow, structured content that is queried and rendered in many places. The
reasoning, say it out loud to the user: a Canvas page stores its prop values in an opaque
`component_tree` field, so those values are **not** a queryable field-per-datum model. If the content
must be reachable by Views, feeds, JSON:API, search facets, or per-field translation and validation,
it needs to be a real node/paragraph field, not a prop in a component tree. A products catalog, an
event schedule, a course listing: nodes and paragraphs. A campaign page: Canvas.

### Check eligibility BEFORE you assign modes

**Canvas cannot store array-of-object props.** Every `data-for` list component in the catalog is
therefore Canvas-ineligible — catalog-wide only **251 of 528** components (about 48%) are eligible.
Check the set you picked in step 5:

    node <drupal-theme-skill>/bin/magoo canvas-check <id…>        # no ids = the whole catalog
    node <drupal-theme-skill>/bin/magoo canvas-check <id…> --json

    node <drupal-theme-skill>/bin/magoo canvas-check dashboard/stat-card marketing/feature-grid cards/card-grid
    # OK  dashboard/stat-card
    # NO  marketing/feature-grid
    #       prop "items" has the shape {"type":"array","items":{"type":"object"}} — Drupal Canvas has
    #       no field type/widget for it. …
    # OK  cards/card-grid
    #
    # 2/3 Canvas-eligible (use config: "paragraph" for the rest).

Note **`cards/card-grid` is eligible**: containers whose repeat is a **slot** (card-grid `items`,
pricing-tiers `plans`, stats-band `items`, section-wrapper `content`) are Canvas-native — you nest
leaf-card instances into the slot. It is the *prop*-shaped repeats that fail. So the container +
leaf-card pairing the catalog already recommends is also the Canvas-friendly one.

`create-child` warns on stderr and **falls back to `paragraph` automatically** for a component
requested as `canvas` that isn't eligible — but check first anyway, so the mode table you show the
user is the truth.

### The realistic answer is a mix

A real site is usually **Canvas for the composable marketing/page components, paragraphs for the
list-shaped ones** (navbar, footer-columns, faq-accordion, feature-grid, pricing tables, data
tables…). Present the component table from step 5 with a `mode` column and confirm it.

Canvas mode is supported by **`create-child`** (the path this skill uses). The standalone
`magoo config <id> --as …` subcommand takes `paragraph|node|custom-field` only — there is nothing to
emit for Canvas.

`host_content_type` (step 2) builds the **paragraph** page-builder: a node bundle whose field stacks
the paragraph bundles. Canvas brings its own page builder (the `canvas_page` entity, editor at
`/canvas/editor/canvas_page/<id>`), so an all-Canvas theme does not need `host_content_type` — set it
when the theme has paragraph-mode components an editor must stack.

## 8. Scaffold, build, verify

Write the answers JSON (shape below), then generate the child theme:

    node <drupal-theme-skill>/bin/magoo create-child --answers answers.json --themes-dir web/themes/custom

`--themes-dir` takes the Drupal **themes directory** (e.g. `web/themes/custom`), not the theme's own
directory — the child lands in `<themes-dir>/<machine_name>`. `--out` still works as an alias, but
`--themes-dir` is the documented flag. `create-child` installs `magoo_agentic_base_theme` alongside
automatically if the site doesn't have it yet (equivalent to running
`magoo install-base --out web/themes/custom` yourself first — you rarely need to run that
separately), writes the child, and vendors a `magoo-components` skill into the child so the next
agent can add components without this repo.

Then, **in this order**:

1. `composer require` + `drush en` the module dependencies it prints (`paragraphs`,
   `entity_reference_revisions`, `custom_field`, `canvas` when any component is in `canvas` mode, and
   whatever else the chosen components need). `create-child` puts them in the theme `.info.yml`
   `dependencies:` and prints the exact commands.
2. If step 4 said yes to scroll animations, add the AOS wiring now
   (`references/scroll-animations.md`) — the theme JS file plus the `js:` key in
   `<machine>.libraries.yml`.
3. **Build the child's CSS before enabling the theme** — it ships with no prebuilt CSS, and Tailwind
   only emits the utility classes it saw at build time:

       ddev npm install --prefix <themes-dir>/<machine_name>
       ddev npm run build:css --prefix <themes-dir>/<machine_name>

   Re-run `build:css` after every subsequent component add, or new utilities silently render
   unstyled.
4. Enable the theme, `drush cim --partial`, `drush cr`. The `drush cr` is what makes Canvas discover
   the SDCs and create their `canvas.component.sdc.<machine>.<name>` entities — check them at
   `/admin/appearance/component`, and read `/admin/appearance/component/status` for anything Canvas
   rejected (it prints the reason).

The child does **not** get its own `theme-settings.php` — it inherits the base theme's whole
design-token settings form. Tell the user the tokens they picked in step 1 are editable afterward at
`/admin/appearance/settings/<machine_name>`.

**Always verify in a browser** with the `agent-browser` skill before you call it done — a green
build renders nothing.

## Answers JSON

    {
      "machine_name": "acme_theme",
      "name": "Acme Theme",
      "description": "…",
      "purpose": "…",
      "reference": "https://styles.refero.design/style/…",
      "tokens": {
        "color_primary": "#0447ff",
        "radius_card": "20px",
        "font_heading": "\"Waldenburg\", sans-serif",
        "container_max_width": "72rem",
        "full_bleed_regions": "header,hero,pre_footer,footer_columns,footer_bottom"
      },
      "host_content_type": { "machine": "landing_page", "name": "Landing Page" },
      "components": [
        { "id": "marketing/hero-split", "config": "canvas" },
        { "id": "cards/card-grid", "config": "canvas" },
        { "id": "navigation/navbar", "config": "paragraph" },
        { "id": "dashboard/stat-card", "config": "paragraph", "props": { "trend": "up" } }
      ]
    }

`tokens` keys are the token keys in `tokens.manifest.json` (including the layout ones from step 3).
Anything omitted keeps the base default. A component's `config` is `canvas` | `paragraph` | `node` |
`custom-field` (step 7; default `paragraph`) and the modes mix freely. A component entry's `props` is
optional — set it when step 6 picked a non-default enum/prop value for that component (e.g.
`dashboard/stat-card`'s `trend: "up"`); scalar values there become the generated field's
`default_value` in `paragraph`/`node` mode. **`props` does nothing in `canvas` mode** — Canvas takes a
component's default values from the SDC's own `examples`, which the generator emits for every required
prop.

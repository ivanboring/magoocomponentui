# Researched Facts & Reference-Theme Learnings

## Drupal SDC (Single Directory Components)
- Files: `<name>.component.yml` (required) + `<name>.twig` (required) + optional `.css`, `.js`, assets, `README.md`.
- **Props** = JSON Schema under `props: { type: object, properties: {...} }`. Supported: string, string+`contentMediaType: text/html` (rich), textarea (`$ref: json-schema-definitions://canvas.module/textarea`), boolean, integer (`minimum`/`maximum`), link (`format: uri` / `uri-reference`), enum (+ `meta:enum` for labels), image object (`$ref: json-schema-definitions://canvas.module/image`), date (`format: date`), array (`items`). `required: [...]` list; `title`, `description`, `examples`.
- **Slots** = `slots: { name: { title, description } }`. Rendered in twig as `{{ slotname }}` (or `{{ content.slotname }}`). Slots accept any SDC/child component (composition).
- Canvas auto-generates an edit form from props.

## Drupal Code Components (Canvas)
- Rendered with **Preact** + React-compat layer. Props + `children`/named slots.
- Authored in-browser or in a local codebase (source control, shared files, assets).

## custom_field module
- Composite field: many columns stored in **one table** (perf/scale alternative to paragraphs/entity-reference).
- Subfield types + widgets/formatters; flexbox inline layout; formatters incl. Default, Inline, HTML List, Table, and **Single Directory Components** (maps complex fields straight onto an SDC).
- Project: https://www.drupal.org/project/custom_field

## Reference theme `../ai_base_theme/components` (hand-authored SDC)
Structure: `01-atoms/ 02-molecules/ 03-organisms/`; each component has `.component.yml`, `.twig`, `.css` (placeholder), `.js`, `.stories.js`.

Learnings adopted:
- **Extended component.yml**: `$schema: …/core/assets/schemas/v1/metadata.schema.json` plus `status`, `subtype`, `group` (e.g. `Molecules/Marketing`), `long_description`, `visual_description`, `typical_usage`, `attribution`, `libraryOverrides`. Our SDC emitter mirrors these.
- **JS-hook classes**: `.card-podcast__player`, `.card-podcast__audio` — component-scoped, separate from Tailwind styling utilities.
- **Portable JS**: IIFE, `document.querySelectorAll('.hook').forEach(init)`, DOMContentLoaded + `MutationObserver` re-init (Drupal AJAX / Storybook / static). No `Drupal.behaviors` dependency.
- **Slot composition**: organisms (`card-grid`, `card-list`, `card-slider`) expose `items` / `bottom_content` slots rendered `{{ items }}` / `{{ content.bottom_content }}`.
- **Dynamic utility classes** from props: `grid-cols-{{ mobile_cols }} md:grid-cols-{{ tablet_cols }}` → must be **safelisted** in Tailwind.
- **CSS files are empty placeholders** — confirms no-CSS constraint.
- **Storybook** renders twig via a custom `.storybook/twig-renderer.js` with the template inlined in the story. (We instead render compiled/canonical HTML directly with the HTML renderer.)
- Existing naming vocabulary: `card-*`, `cta-*`, `menu-*`, `pricing-card-*` — informs our catalog naming.

## Drupal template idioms — verified against ../drupal113 (Drupal 11.3, 2026-07-04)
Checked a real Drupal 11.3 checkout to confirm the generator's twig output matches core conventions:
- **Object/array prop access uses plain dot notation** — `{{ prop.subkey }}`, `{{ item.label }}` with **no `.value` wrapper**. Core's `toolbar-button.twig` reads `icon.icon_id`, `icon.pack_id` directly. Our emitter's `{{ item.label }}` output is correct.
- **Array props**: core guards with `{% if x is iterable %}` before `{% for %}`/`|map`. Our emitter emits a bare `{% for item in pages %}` (fine for `required` array props; a future emitter tweak could add the `is iterable` guard for optional ones).
- **SDC schema for arrays**: core only ever uses scalar item schemas (`items: { type: string }`). Array-of-objects with per-item `properties` is valid JSON-Schema but has **no in-repo precedent**; our loose `items: { type: object }` is acceptable. A single object prop with full `type: object` + `properties` + `required` does exist (`toolbar-button` `icon`). → Optional future enhancement: let `component.def.yml` declare array-item sub-properties so the SDC schema + Drupal custom_field columns are complete (would also fix the boolean-subfield gap below).
- **custom_field + paragraphs modules are NOT installed** in ../drupal113, so the paragraph/custom_field column mapping can't be validated empirically there. Known limitation of `inferColumns` (drupal-config.js): it only scans `{{ item.x }}` interpolations, so object subfields used **only** in `data-if`/`data-for` directives (e.g. pagination `item.ellipsis`) or typed as boolean (e.g. `item.active`) are dropped or mistyped as `string` in the custom_field column plan. Advisory only — the twig/React/Vue render output is correct.
- **Feeding fields into an SDC**: `{% embed 'ns:comp' with {...} %}` + `{% block slot %}`, or `{% include 'ns:comp' with {...} only %}`; multi-value fields loop with `{% for item in items %}{{ item.content }}{% endfor %}`.

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

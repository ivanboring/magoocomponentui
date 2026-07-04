# Drupal Paragraph + custom_field Mapping

Every component generates a Drupal integration scaffold into `dist/<id>/drupal/` so an
agent or site-builder can wire the component to real content on a **paragraph** entity.

Generated files:

| File | Purpose |
|---|---|
| `fields.yml` | Declarative field plan: each prop → a Drupal field; each slot → a child-paragraph reference. |
| `paragraph--<name>.html.twig` | Paragraph template that renders the SDC from the paragraph's field values. |
| `custom_field.<name>.yml` | Column plan for complex/repeating props (only when the component has `array`/`object` props). |

## Prop → field type mapping

| `component.def.yml` type | Drupal field type | Notes |
|---|---|---|
| `string` | `string` | Reads `.value`. |
| `text` | `text_long` | Multiline. |
| `html` | `text_long` (`full_html`) | Rich text. |
| `integer` | `integer` | Reads `.value`. |
| `boolean` | `boolean` | `.value ? true : false`. |
| `enum` | `list_string` | `allowed_values` copied from the enum values. |
| `link` | `link` | Reads `.0.url`. |
| `image` | `entity_reference` → media (`image` bundle) | Template resolves the media image URI. |
| `array` | **`custom_field`** (cardinality −1) | Columns **inferred** from `item.<col>` usages in the template. |
| `object` | **`custom_field`** (cardinality 1) | Single composite value. |

## Slots

Slots map to `entity_reference_revisions` fields targeting **paragraphs** — so an editor
places child components inside (matching SDC slot composition). For simple markup a
`text_long` field also works; the template passes rendered `content.field_<slot>`.

## custom_field columns are inferred

For a complex prop the generator scans the template for `item.<column>` references and
emits those as custom_field columns, guessing a subfield type:

- used in a `{{{ raw }}}` position → `text_long`
- used as an `src` attribute → `image`
- used as an `href` attribute → `uri`
- otherwise → `string`

Because custom_field ships an **SDC formatter**, a complex field maps straight onto the
component: the paragraph template passes the custom_field item list and the component
iterates `item.<column>`.

## Adapting

The scaffold is intentionally editable — field machine-names default to `field_<prop>`.
Rename to match an existing bundle, adjust image styles, or swap a slot from
paragraph-reference to text as the site requires. The `{% embed 'your_theme:<name>' %}`
line points at wherever the SDC is installed (theme or module namespace).

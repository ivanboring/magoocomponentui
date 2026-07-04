# Drupal Paragraph + custom_field Mapping

Every component generates a Drupal integration scaffold into `dist/<id>/drupal/` so an
agent or site-builder can wire the component to real content on a **paragraph** entity.

Generated files:

| File | Purpose |
|---|---|
| `config/` (+ `config-<variant>/`) | **Importable Drupal config entities** — paragraph type, field storage + instances, form + view displays. `drush config:import --partial --source=…`. |
| `fields.yml` | Human-readable field plan: each prop → a Drupal field; each slot → a child-paragraph reference. |
| `paragraph--<name>.html.twig` | Paragraph template that renders the SDC from the paragraph's field values. |
| `custom_field.<name>.yml` | Column plan for complex/repeating props (when the component has `array`/`object` props). |

## Importable config

Each `config[/-variant]/` folder is a self-contained set of config entities you can import
(enable the required modules first). Field-type machine names are import-accurate; widgets,
formatters, and settings are sensible defaults meant to be tuned.

## Choosing a field type per prop

By default a prop maps by its type (below). Override per prop in `component.def.yml`:

```yaml
props:
  location: { type: object, drupal: { field_type: address } }
  when:     { type: string, drupal: { field_type: datetime } }
  video:    { type: link,   drupal: { field_type: video_embed } }
  # Alternatives → one importable config set each (e.g. a table via either field type):
  rows:     { type: array, items: object, drupal: { field_type: [tablefield, custom_field] } }
  # View-display formatter override (e.g. render numeric data via Charts):
  series:   { type: array, items: object, drupal: { field_type: custom_field, formatter: chart } }
```

## Supported field types

**Core:** `string`, `text_long`, `integer`, `boolean`, `list_string` (enum), `link`,
`datetime`, `daterange`, `image`, `media_image` (entity_reference → media), `paragraph`
(entity_reference_revisions), **`custom_field`**.

**Contrib** (module must be enabled): `address` ([Address]), `datetime`/`daterange`
(core; the [Date] contrib is legacy), `video_embed` ([Video Embed Field]), `geofield`
([Geofield]), `geolocation` ([Geolocation]), `svg_image` ([SVG Image Field]), `faqfield`
([FAQ Field]), `office_hours` ([Office Hours]), `tablefield` ([Table Field]); plus a
`formatter: chart` view-display option ([Charts]).

[Address]: https://www.drupal.org/project/address
[Date]: https://www.drupal.org/project/date
[Video Embed Field]: https://www.drupal.org/project/video_embed_field
[Geofield]: https://www.drupal.org/project/geofield
[Geolocation]: https://www.drupal.org/project/geolocation
[SVG Image Field]: https://www.drupal.org/project/svg_image_field
[FAQ Field]: https://www.drupal.org/project/faqfield
[Office Hours]: https://www.drupal.org/project/office_hours
[Table Field]: https://www.drupal.org/project/tablefield
[Charts]: https://www.drupal.org/project/charts

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

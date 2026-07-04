# Taxonomy

Seed classification for the catalog. Used by `metadata.yml → categorization` and the
preview nav. The first 218 planned components live in `catalog/first-200.md`.

## Categories → subcategories (seed)

| Category | Subcategories (seed) |
|---|---|
| Atoms | Buttons, Indicators, Media, Typographic |
| Navigation | Bars, Menus, Pagination, Wayfinding |
| Overlays | Dialogs, Menus, Feedback |
| Notifications | Toasts, Feedback, Center, Activity |
| Cards | Media, Commerce, People, Editorial |
| Video | Players, Timeline, Library, Live |
| Sports | Brackets, Live, Tables, Match, Teams |
| Commerce | Catalog, Cart, Checkout, Reviews |
| Editorial | Article, Attribution, Wayfinding, Engagement |
| Marketing | Hero, Features, Social proof, Conversion |
| Data | Tables, Metrics, Time, Charts |
| Forms | Inputs, Search, Filters, Flows |
| Social | Comments, Profiles, Feed, Chat |
| Layout | Sections, Grids, Structure |
| Dashboard | Layout, Widgets, Charts, Metrics |

## Atomic types

`atom` (indivisible) · `molecule` (a few atoms) · `organism` (self-contained section) ·
`full` (a whole page region / complex composite).

## Usage types (open vocabulary)

`grid`, `card`, `list-item`, `highlight`, `banner`, `hero`, `table`, `nav`, `overlay`,
`media`, `form`, `stat`, `timeline`, `player` — extend as needed.

## Maturity ladder

`ai-generated` → `human-approved` → `production-ready`.

## Adding to the catalog

New components pick one `category` + `subcategory` from (or extended beyond) this seed,
an `atomic_type`, and one or more `usage_type`s. Keep concepts **granular** — one component
per concept (a podcast card and a movie card are separate components), each modestly
configurable via props/variants.

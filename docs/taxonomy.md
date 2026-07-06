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
| Events | Ticketing, Schedule, Venue |

## Atomic types

`atom` (indivisible) · `molecule` (a few atoms) · `organism` (self-contained section) ·
`full` (a whole page region / complex composite).

## Usage types (open vocabulary)

`grid`, `card`, `list-item`, `highlight`, `banner`, `hero`, `table`, `nav`, `overlay`,
`media`, `form`, `stat`, `timeline`, `player` — extend as needed.

### Derived cross-listing (secondary categories)

`usage_type` is not only a tag vocabulary — a curated map in
`packages/schema/src/catalog.js` (`USAGE_COLLECTIONS`) turns certain tags into **secondary
category memberships** so a component shows up under a cross-cutting grouping in addition to
its one primary `category`. Current map: `card → Cards`, `nav → Navigation`,
`overlay → Overlays`, `form → Forms`. The build derives `secondary_categories` per component
(skipping its own primary category); the preview folds these into the category dropdown so, e.g.,
selecting **Cards** lists every `card`-tagged component regardless of its domain. Membership is
**category-level only** — a specific subcategory filter still shows a component only under its
primary home. Add a collection by extending the map and rebuilding — no per-component or schema
change needed.

## Maturity ladder

`ai-generated` → `human-approved` → `production-ready`.

## Adding to the catalog

New components pick one `category` + `subcategory` from (or extended beyond) this seed,
an `atomic_type`, and one or more `usage_type`s. Keep concepts **granular** — one component
per concept (a podcast card and a movie card are separate components), each modestly
configurable via props/variants.

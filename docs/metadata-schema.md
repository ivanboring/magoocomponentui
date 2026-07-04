# metadata.yml Schema

Every component has a `metadata.yml` validated (ajv) by `pnpm build` / `pnpm catalog`.
It is the agent-facing catalog record — prose and classification, separate from the
machine `component.def.yml` (which owns prop/slot *types*). Full schema:
`packages/schema/src/metadata.schema.js`.

## Required

- `short_description` — one sentence; what it is and when to reach for it.
- `lifecycle` — `experimental` | `stable` | `deprecated`.
- `categorization` — object, requires `category`, `atomic_type`, `maturity` (below).

## Optional (fill in for a complete record)

| Field | Type | Notes |
|---|---|---|
| `long_visual_description` | string | What it looks like, in detail. |
| `use_cases` | string[] | **5–15** items when present. |
| `screenshots` | theme → breakpoint → path | Auto-filled by the screenshot pipeline; don't hand-write. |
| `recommended_for` | string[] | When to use it. |
| `avoid_for` | string[] | When not to. |
| `markets` | string[] | Regions/verticals. |
| `example_usage` | string | Prose usage note. |
| `props` | name → prose | Per-prop usage guidance (types live in `component.def.yml`). |
| `slots` | name → prose | Per-slot usage guidance. |
| `example_prompts` | string[] | Prompts an agent might use to place it. |
| `content_model` | string | What content goes in. |
| `theming` | `{ tokens_used: string[] }` | CSS variables the component relies on. |
| `editorial_guidance` | string | Voice/copy guidance. |

## `categorization`

| Field | Values |
|---|---|
| `category` (req) | e.g. Sports, Video, Notifications, Commerce… (see `taxonomy.md`) |
| `subcategory` | free string within the category |
| `atomic_type` (req) | `atom` \| `molecule` \| `organism` \| `full` |
| `usage_type` | string[] — `grid`, `card`, `highlight`, `list-item`, `banner`, … |
| `maturity` (req) | `ai-generated` \| `human-approved` \| `production-ready` |
| `wcag` | `{ level: A\|AA\|AAA, notes }` |
| `keyboard_support` | string — describe focus/keys, or "none" |
| `seo_score` | integer 0–100 |
| `text_direction` | `ltr` \| `rtl` \| `both` |

See `components/notifications/alert/metadata.yml` for a complete worked example.

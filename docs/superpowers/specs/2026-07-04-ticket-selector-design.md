# ticket-selector + ticket-card — Design

## Purpose

First components in a new **Events & Ticketing** domain (`components/events/`), chosen
as a "complex parent + child" proof point: an interactive organism (`ticket-selector`)
composed from a repeatable interactive molecule (`ticket-card`), following the existing
`stats-band` ↔ `stat-card` slot-composition + `relationships` pattern.

## Components

### `components/events/ticket-card/` (molecule)

**Props**

| prop | type | required | default | notes |
|---|---|---|---|---|
| `tier_name` | string | yes | — | e.g. "General Admission" |
| `price_display` | string | yes | — | formatted for humans, e.g. `"$49"` |
| `price_cents` | integer | yes | — | numeric price for JS total calc |
| `description` | string | no | — | short perk text |
| `max_quantity` | integer | no | `10` | stepper upper clamp |
| `initial_quantity` | integer | no | `0` | stepper starting value |
| `status` | enum `[available, sold-out]` | no | `available` | drives variant + disables stepper |

**Variants** (`status@class`): `available: ""`, `sold-out: "opacity-60"`. Sold-out also
shows a "Sold out" badge (`data-if="status" ...` comparison handled via the variant map;
badge markup gated on the same enum through a small `data-if` on a derived flag — see
Notes on template limits below).

**Slots**: none.

**Interactivity** (`behavior.js`): `-`/`+` buttons adjust quantity in
`[0, max_quantity]` (locked at `0`, buttons disabled, if `status=sold-out`). Updates the
visible number and `root.dataset.quantity`. Dispatches a bubbling
`ticket-card:change` CustomEvent (no payload needed — parent re-reads dataset).

**Accessibility**: stepper buttons carry `aria-label` naming the tier ("Decrease
quantity for General Admission" / "Increase quantity for General Admission"); sold-out
sets `disabled` + `aria-disabled="true"`.

### `components/events/ticket-selector/` (organism)

**Props**

| prop | type | required | default | notes |
|---|---|---|---|---|
| `title` | string | no | — | optional heading |
| `currency_symbol` | string | no | `"$"` | prefix for the total |
| `checkout_label` | string | no | `"Checkout"` | CTA text |

**Slots**: `tiers` — consumer places `ticket-card` instances here (identical
composition pattern to `stats-band`'s `items` slot).

**Interactivity** (`behavior.js`): listens for `ticket-card:change` bubbling up from
descendants; on each event, queries all `.ticket-card` elements under `root` and
recomputes the total by summing `dataset.quantity × dataset.priceCents` (stateless
recompute — no need to track child state independently, robust to however many tiers
are slotted in). Updates `.ticket-selector__total` (`aria-live="polite"`); toggles the
`.ticket-selector__checkout` button's `disabled` state based on `total > 0`.

## Metadata / relationships

- `ticket-selector/metadata.yml`: `relationships.children: [events/ticket-card]`.
- `ticket-card/metadata.yml`: `relationships.parents: [events/ticket-selector]`.
- Both get full required metadata fields (`short_description`, `lifecycle: experimental`,
  `categorization` with `category: events`, appropriate `atomic_type`, `maturity`),
  example prompts, and `content_model` notes — same bar as `stat-card`/`stats-band`.

## Notes on template-directive limits

The directive vocabulary only supports dotted-path expressions + `!` negation — no
equality tests. The "Sold out" badge therefore can't be `data-if="status == 'sold-out'"`.
Following the `alert`/`stat-card` precedent (which solves the analogous problem via the
variant class-map rather than conditional logic), the badge visibility will also route
through the `status@class` mechanism: the variant map controls a wrapper class, and the
badge element's visibility is driven by that class (`hidden` utility toggled per variant)
rather than a `data-if`. No new directive syntax required.

## Build & verification plan

1. Author `ticket-card` (def + template + metadata + behavior.js), then `ticket-selector`
   (def + template + metadata + behavior.js), each with an `examples/` payload.
2. `pnpm build` — generate SDC/Preact/React/Vue/Storybook/Drupal variants, confirm no
   generator errors.
3. `pnpm test` stays green (no generator changes expected — pure content addition).
4. `pnpm audit` — check axe-core results, esp. stepper button labeling and sold-out
   `aria-disabled` semantics.
5. `pnpm screenshots` — capture the new components across the 4 themes × 4 breakpoints.
6. Manual check via `pnpm preview:dev`: add/remove quantities across 2+ ticket-card
   children, verify total math and checkout enable/disable, verify sold-out tier is
   inert.

## Out of scope

- No real checkout/payment flow — the CTA is a styled, enable/disable-only button.
- No currency i18n/formatting library — `currency_symbol` is a literal prefix string.
- No drag-reorder, promo codes, or per-tier fee lines.

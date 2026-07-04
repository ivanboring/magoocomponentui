# ticket-selector + ticket-card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author two new catalog components — `ticket-card` (molecule) and `ticket-selector`
(organism) — in a new `events` domain, with a live quantity/total interaction, following
the design in `docs/superpowers/specs/2026-07-04-ticket-selector-design.md`.

**Architecture:** Two component source folders under `components/events/`. `ticket-card`
is a self-contained stepper with a bubbling `ticket-card:change` CustomEvent.
`ticket-selector` composes `ticket-card` instances via a named slot (same pattern as
`stats-band`/`stat-card`) and recomputes a running total statelessly by reading
`data-*` attributes off its `.ticket-card` descendants whenever that event fires.

**Tech Stack:** Existing Magoo generator toolchain (component.def.yml + template.html +
metadata.yml + behavior.js → `pnpm build` emits SDC/Preact/React/Vue/Storybook/Drupal).
No new packages, no generator changes.

## Global Constraints

- Prop types are limited to: `string`, `html`, `text`, `integer`, `boolean`, `enum`,
  `link`, `image`, `array`, `object` — no floating-point type, so money is modeled as
  a display string (`price_display`) plus an `integer` cents value (`price_cents`).
- Template expressions are dotted-path only, no equality tests — enum-driven visual
  branching must go through the `variants:` class-map mechanism (`{{ prop@class }}`),
  never `data-if` with a comparison.
- Root element of every component template carries a class equal to the component
  name (the JS hook); `behavior.js` targets only `.<component>__*` hook classes.
- `behavior.js` reads configuration exclusively from `root.dataset` (`data-*`
  attributes in the template) — the portable init call passes no props object.
- Only tokenized Tailwind utilities for anything themable (colors, radius, shadow,
  spacing, type) — verified against `packages/themes/tokens.contract.css`.
- Every `metadata.yml` must satisfy the required schema fields: `short_description`,
  `lifecycle`, `categorization.{category,atomic_type,maturity}` — validated by
  `pnpm catalog` (ajv), which fails the build on any schema violation.

---

### Task 1: Register the Events category in the taxonomy

**Files:**
- Modify: `docs/taxonomy.md`

**Interfaces:** None (docs only).

- [ ] **Step 1: Add the row**

In `docs/taxonomy.md`, in the `## Categories → subcategories (seed)` table, add a row
right after the `Dashboard` row:

```markdown
| Events | Ticketing, Schedule, Venue |
```

- [ ] **Step 2: Commit**

```bash
git add docs/taxonomy.md
git commit -m "Add Events category to taxonomy"
```

---

### Task 2: Author `ticket-card`

**Files:**
- Create: `components/events/ticket-card/component.def.yml`
- Create: `components/events/ticket-card/template.html`
- Create: `components/events/ticket-card/behavior.js`
- Create: `components/events/ticket-card/metadata.yml`
- Create: `components/events/ticket-card/examples/default.json`
- Create: `components/events/ticket-card/examples/sold-out.json`

**Interfaces:**
- Produces: root hook class `.ticket-card`; `data-status`, `data-price-cents`,
  `data-quantity`, `data-max-quantity` attributes on the root; a bubbling
  `ticket-card:change` CustomEvent dispatched on the root whenever quantity changes.
  `ticket-selector` (Task 4) consumes these exact attribute names.

- [ ] **Step 1: Write `component.def.yml`**

```yaml
name: ticket-card
props:
  tier_name:
    type: string
    required: true
    title: Tier name
    example: "General admission"
  price_display:
    type: string
    required: true
    title: Price (display)
    description: Formatted for humans, e.g. "$49".
    example: "$49"
  price_cents:
    type: integer
    required: true
    title: Price (cents)
    description: Numeric price used for the running total calculation.
    example: 4900
  description:
    type: string
    title: Description
    example: "Standing room, all-ages"
  max_quantity:
    type: integer
    default: 10
    title: Max quantity
    description: Upper clamp for the quantity stepper.
  initial_quantity:
    type: integer
    default: 0
    title: Initial quantity
  status:
    type: enum
    values: [available, sold-out]
    default: available
    title: Status
    description: Sold-out disables the stepper and shows a badge.
variants:
  status:
    available: "hidden"
    sold-out: ""
```

- [ ] **Step 2: Write `template.html`**

```html
<div class="ticket-card flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-(--space-card) shadow-card" data-status="{{ status }}" data-price-cents="{{ price_cents }}" data-quantity="{{ initial_quantity }}" data-max-quantity="{{ max_quantity }}">
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <h3 class="ticket-card__tier font-heading text-on-surface">{{ tier_name }}</h3>
      <span class="ticket-card__badge shrink-0 rounded-pill bg-danger px-2 py-0.5 text-xs font-medium text-danger-contrast {{ status@class }}">Sold out</span>
    </div>
    <p data-if="description" class="mt-1 text-sm text-on-surface-muted">{{ description }}</p>
    <p class="ticket-card__price mt-1 text-sm font-medium text-on-surface">{{ price_display }}</p>
  </div>
  <div class="ticket-card__stepper flex shrink-0 items-center gap-2">
    <button type="button" class="ticket-card__decrement flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised" aria-label="Decrease quantity for {{ tier_name }}">−</button>
    <span class="ticket-card__quantity w-6 text-center font-heading text-on-surface tabular-nums" aria-live="polite">{{ initial_quantity }}</span>
    <button type="button" class="ticket-card__increment flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised" aria-label="Increase quantity for {{ tier_name }}">+</button>
  </div>
</div>
```

- [ ] **Step 3: Write `behavior.js`**

```js
/**
 * ticket-card behavior — quantity stepper.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root, props) {
  const decrement = root.querySelector(".ticket-card__decrement");
  const increment = root.querySelector(".ticket-card__increment");
  const quantityEl = root.querySelector(".ticket-card__quantity");
  if (!decrement || !increment || !quantityEl) return () => {};

  const max = Number(root.dataset.maxQuantity) || 0;
  const soldOut = root.dataset.status === "sold-out";

  function render(quantity) {
    root.dataset.quantity = String(quantity);
    quantityEl.textContent = String(quantity);
    decrement.disabled = soldOut || quantity <= 0;
    increment.disabled = soldOut || quantity >= max;
  }

  function change(delta) {
    const current = Number(root.dataset.quantity) || 0;
    const next = Math.min(max, Math.max(0, current + delta));
    if (next === current) return;
    render(next);
    root.dispatchEvent(new CustomEvent("ticket-card:change", { bubbles: true }));
  }

  function onDecrement() {
    change(-1);
  }
  function onIncrement() {
    change(1);
  }

  if (soldOut) {
    decrement.setAttribute("aria-disabled", "true");
    increment.setAttribute("aria-disabled", "true");
  }

  render(Number(root.dataset.quantity) || 0);
  decrement.addEventListener("click", onDecrement);
  increment.addEventListener("click", onIncrement);
  return () => {
    decrement.removeEventListener("click", onDecrement);
    increment.removeEventListener("click", onIncrement);
  };
}
```

- [ ] **Step 4: Write `metadata.yml`**

```yaml
short_description: A single ticket-tier row with a price and a quantity stepper, used inside ticket-selector.
long_visual_description: >
  A horizontal row on the surface colour with a card radius and shadow. The tier name
  and an optional "Sold out" badge sit top-left, with a description line and formatted
  price below. A quantity stepper — minus button, live count, plus button — sits on the
  trailing edge. Sold-out tiers show the badge and disable the stepper.

use_cases:
  - A single ticket tier inside a ticket-selector for an event.
  - Concert, conference, or sports-match tier pricing row.
  - Sold-out tier shown alongside available ones.
  - Add-on or merchandise line with a quantity stepper.

recommended_for:
  - Ticketing and checkout flows for events.
  - Anywhere a per-item quantity needs live total math.
avoid_for:
  - A single, non-quantity purchase (use a plain CTA button).
  - Seat-specific selection (use a seat map component).

markets:
  - Global

example_usage: >
  Place two or more ticket-card components inside a ticket-selector's tiers slot, one
  per pricing tier. Set status to sold-out to disable a tier.

props:
  tier_name: The ticket tier's name, e.g. "General admission" or "VIP balcony".
  price_display: The human-formatted price, including currency symbol.
  price_cents: The numeric price in cents; drives the parent's running total.
  description: A short one-line perk or restriction note.
  max_quantity: The highest quantity a buyer can select for this tier.
  initial_quantity: The quantity shown when the component first renders.
  status: Set to sold-out to disable the stepper and show the badge.

example_prompts:
  - "Add a $49 general admission ticket tier with up to 8 tickets."
  - "Show a sold-out VIP balcony ticket tier."
  - "Add three ticket tiers: general, VIP, and backstage."

relationships:
  parents:
    - events/ticket-selector

lifecycle: experimental
content_model: A tier name, a formatted price, an optional description, and a quantity stepper.

theming:
  tokens_used:
    - --color-surface
    - --color-on-surface
    - --color-on-surface-muted
    - --color-border
    - --color-danger
    - --color-danger-contrast
    - --radius-card
    - --radius-control
    - --radius-pill
    - --shadow-card
    - --font-heading
    - --space-card
    - --duration-token

editorial_guidance: >
  Tier names should match how the box office names them. Keep descriptions to one
  short clause. Never show a price without its currency symbol.

categorization:
  category: Events
  subcategory: Ticketing
  atomic_type: molecule
  usage_type: [list-item, card]
  maturity: ai-generated
  wcag:
    level: AA
    notes: Stepper buttons carry descriptive aria-labels naming the tier; sold-out sets aria-disabled; live quantity uses aria-live="polite".
  keyboard_support: Stepper buttons are focusable and activate on Enter/Space; disabled when sold-out.
  seo_score: 35
  text_direction: both
```

- [ ] **Step 5: Write `examples/default.json`**

```json
{
  "tier_name": "General admission",
  "price_display": "$49",
  "price_cents": 4900,
  "description": "Standing room, all-ages",
  "max_quantity": 8,
  "initial_quantity": 0,
  "status": "available"
}
```

- [ ] **Step 6: Write `examples/sold-out.json`**

```json
{
  "tier_name": "VIP balcony",
  "price_display": "$129",
  "price_cents": 12900,
  "description": "Reserved seating with early entry",
  "max_quantity": 4,
  "initial_quantity": 0,
  "status": "sold-out"
}
```

- [ ] **Step 7: Commit**

```bash
git add components/events/ticket-card
git commit -m "Add ticket-card component"
```

---

### Task 3: Build and validate `ticket-card` in isolation

**Files:** None created — verification only.

**Interfaces:**
- Consumes: `components/events/ticket-card/*` from Task 2.

- [ ] **Step 1: Run the build**

Run: `pnpm build`
Expected: exits 0; output includes a line for `events/ticket-card` (the build script
logs a count of generated components — no per-id line, so instead verify via Step 2).

- [ ] **Step 2: Verify generated output exists**

Run: `ls dist/events/ticket-card`
Expected: a listing that includes (at minimum) SDC, react, vue, storybook, and drupal
output directories/files — matching the shape already present for
`dist/dashboard/stat-card` (run `ls dist/dashboard/stat-card` to compare shapes if unsure).

- [ ] **Step 3: Run the catalog build (schema validation)**

Run: `pnpm catalog`
Expected: exits 0, no `[events/ticket-card]` lines in the output. If it prints a
`metadata.yml` schema error for `events/ticket-card`, fix `metadata.yml` from Task 2
Step 4 to satisfy the error before continuing.

- [ ] **Step 4: Run the unit test suite (regression check)**

Run: `pnpm test`
Expected: all tests pass (same count as before this task — this task adds no new
generator code, so no new tests are expected to appear or fail).

---

### Task 4: Author `ticket-selector`

**Files:**
- Create: `components/events/ticket-selector/component.def.yml`
- Create: `components/events/ticket-selector/template.html`
- Create: `components/events/ticket-selector/behavior.js`
- Create: `components/events/ticket-selector/metadata.yml`
- Create: `components/events/ticket-selector/examples/default.json`

**Interfaces:**
- Consumes: `.ticket-card` root hook class, and its `data-quantity` /
  `data-price-cents` attributes, from Task 2.
- Produces: root hook class `.ticket-selector`; `.ticket-selector__total` (text
  content is the formatted running total) and `.ticket-selector__checkout`
  (`disabled` when total is 0) as the externally-observable state for manual
  verification in Task 6.

- [ ] **Step 1: Write `component.def.yml`**

```yaml
name: ticket-selector
props:
  title:
    type: string
    title: Title
    example: "Select your tickets"
  currency_symbol:
    type: string
    default: "$"
    title: Currency symbol
  checkout_label:
    type: string
    default: "Checkout"
    title: Checkout label
slots:
  tiers:
    title: Ticket tiers
    description: "Place ticket-card components here; the selector totals their quantities."
```

- [ ] **Step 2: Write `template.html`**

```html
<section class="ticket-selector rounded-card border border-border bg-surface p-(--space-card) shadow-card" data-currency-symbol="{{ currency_symbol }}">
  <h2 data-if="title" class="mb-4 font-heading text-lg text-on-surface">{{ title }}</h2>
  <div class="ticket-selector__tiers flex flex-col gap-(--space-control)">
    <slot name="tiers"></slot>
  </div>
  <div class="mt-(--space-card) flex items-center justify-between border-t border-border pt-(--space-control)">
    <p class="text-sm text-on-surface-muted">Total: <span class="ticket-selector__total font-heading text-on-surface tabular-nums" aria-live="polite">{{ currency_symbol }}0</span></p>
    <button type="button" class="ticket-selector__checkout rounded-button bg-primary px-4 py-2 text-sm font-medium text-primary-contrast transition-colors duration-(--duration-token) disabled:cursor-not-allowed disabled:opacity-50" disabled>{{ checkout_label }}</button>
  </div>
</section>
```

- [ ] **Step 3: Write `behavior.js`**

```js
/**
 * ticket-selector behavior — sums ticket-card descendants into a running total.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root, props) {
  const totalEl = root.querySelector(".ticket-selector__total");
  const checkoutBtn = root.querySelector(".ticket-selector__checkout");
  if (!totalEl || !checkoutBtn) return () => {};

  const symbol = root.dataset.currencySymbol || "$";

  function recompute() {
    const cards = root.querySelectorAll(".ticket-card");
    let totalCents = 0;
    for (const card of cards) {
      const quantity = Number(card.dataset.quantity) || 0;
      const priceCents = Number(card.dataset.priceCents) || 0;
      totalCents += quantity * priceCents;
    }
    totalEl.textContent = `${symbol}${(totalCents / 100).toFixed(2)}`;
    checkoutBtn.disabled = totalCents <= 0;
  }

  function onChange() {
    recompute();
  }

  root.addEventListener("ticket-card:change", onChange);
  recompute();
  return () => root.removeEventListener("ticket-card:change", onChange);
}
```

- [ ] **Step 4: Write `metadata.yml`**

```yaml
short_description: An organism that lays out ticket-card tiers and totals a running price with a checkout CTA.
long_visual_description: >
  A card-radius panel on the surface colour with an optional heading, a vertically
  stacked list of ticket-card tiers, and a divider above a footer row showing the
  running total on the left and a primary checkout button on the right. The button
  stays disabled until at least one ticket is selected across any tier.

use_cases:
  - Ticket purchase panel for a concert, conference, or sports event.
  - Multi-tier pricing selector with live total.
  - Add-on selector with a checkout gate.

recommended_for:
  - Event and ticketing pages.
  - Any purchase flow with 2 or more selectable priced tiers.
avoid_for:
  - A single fixed-price purchase (use a plain CTA button).
  - Seat-specific selection (use a seat map component).

markets:
  - Global

example_usage: >
  Give it an optional title and place two or more ticket-card components in the tiers
  slot. The selector totals quantities across all tiers and enables checkout once the
  total is greater than zero.

props:
  title: Optional short heading above the ticket tiers.
  currency_symbol: Prefix shown before the running total, e.g. "$".
  checkout_label: Text on the checkout button.

slots:
  tiers: The ticket-card tiers to offer; typically two to five.

example_prompts:
  - "Add a ticket selector titled Select your tickets with general and VIP tiers."
  - "Build a ticket purchase panel with a running total and checkout button."
  - "Show a sold-out VIP tier alongside an available general admission tier."

relationships:
  children:
    - events/ticket-card

lifecycle: experimental
content_model: An optional title, a set of ticket-card children, a running total, and a checkout button.

theming:
  tokens_used:
    - --color-surface
    - --color-on-surface
    - --color-on-surface-muted
    - --color-border
    - --color-primary
    - --color-primary-contrast
    - --radius-card
    - --radius-button
    - --shadow-card
    - --font-heading
    - --space-card
    - --space-control
    - --duration-token

editorial_guidance: >
  Keep the title short or omit it. Checkout label should be a verb phrase ("Checkout",
  "Continue to payment") — never just "Submit".

categorization:
  category: Events
  subcategory: Ticketing
  atomic_type: organism
  usage_type: [form, highlight]
  maturity: ai-generated
  wcag:
    level: AA
    notes: Running total uses aria-live="polite" so screen-reader users hear updates; checkout button's disabled state is a real disabled attribute, not visual-only.
  keyboard_support: All interactive elements (steppers in child ticket-cards, checkout button) are native buttons, focusable and Enter/Space activated.
  seo_score: 40
  text_direction: both
```

- [ ] **Step 5: Write `examples/default.json`**

```json
{
  "title": "Select your tickets",
  "currency_symbol": "$",
  "checkout_label": "Checkout",
  "$slots": {
    "tiers": "<div class=\"ticket-card flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-(--space-card) shadow-card\" data-status=\"available\" data-price-cents=\"4900\" data-quantity=\"1\" data-max-quantity=\"8\"><div class=\"min-w-0 flex-1\"><div class=\"flex items-center gap-2\"><h3 class=\"ticket-card__tier font-heading text-on-surface\">General admission</h3><span class=\"ticket-card__badge shrink-0 rounded-pill bg-danger px-2 py-0.5 text-xs font-medium text-danger-contrast hidden\">Sold out</span></div><p class=\"mt-1 text-sm text-on-surface-muted\">Standing room, all-ages</p><p class=\"ticket-card__price mt-1 text-sm font-medium text-on-surface\">$49</p></div><div class=\"ticket-card__stepper flex shrink-0 items-center gap-2\"><button type=\"button\" class=\"ticket-card__decrement flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised\" aria-label=\"Decrease quantity for General admission\">−</button><span class=\"ticket-card__quantity w-6 text-center font-heading text-on-surface tabular-nums\" aria-live=\"polite\">1</span><button type=\"button\" class=\"ticket-card__increment flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised\" aria-label=\"Increase quantity for General admission\">+</button></div></div><div class=\"ticket-card flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-(--space-card) shadow-card\" data-status=\"sold-out\" data-price-cents=\"12900\" data-quantity=\"0\" data-max-quantity=\"4\"><div class=\"min-w-0 flex-1\"><div class=\"flex items-center gap-2\"><h3 class=\"ticket-card__tier font-heading text-on-surface\">VIP balcony</h3><span class=\"ticket-card__badge shrink-0 rounded-pill bg-danger px-2 py-0.5 text-xs font-medium text-danger-contrast \">Sold out</span></div><p class=\"mt-1 text-sm text-on-surface-muted\">Reserved seating with early entry</p><p class=\"ticket-card__price mt-1 text-sm font-medium text-on-surface\">$129</p></div><div class=\"ticket-card__stepper flex shrink-0 items-center gap-2\"><button type=\"button\" class=\"ticket-card__decrement flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised\" aria-label=\"Decrease quantity for VIP balcony\">−</button><span class=\"ticket-card__quantity w-6 text-center font-heading text-on-surface tabular-nums\" aria-live=\"polite\">0</span><button type=\"button\" class=\"ticket-card__increment flex size-8 items-center justify-center rounded-control border border-border text-on-surface transition-colors duration-(--duration-token) hover:bg-surface-raised\" aria-label=\"Increase quantity for VIP balcony\">+</button></div></div>"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add components/events/ticket-selector
git commit -m "Add ticket-selector component"
```

---

### Task 5: Full build, catalog, and audit verification

**Files:** None created — verification only.

**Interfaces:**
- Consumes: both component folders from Tasks 2 and 4.

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 2: Full catalog build (schema validation over every component)**

Run: `pnpm catalog`
Expected: exits 0, no `[events/ticket-card]` or `[events/ticket-selector]` error
lines. Fix any reported `metadata.yml` issues in the two files from Tasks 2/4 before
proceeding.

- [ ] **Step 3: Unit test suite**

Run: `pnpm test`
Expected: all tests pass, same count as before Task 2 (no generator changes were
made in this plan).

- [ ] **Step 4: Storybook build**

Run: `pnpm storybook build`
Expected: exits 0; build output includes stories for `ticket-card` and
`ticket-selector` (check for `Events` in the generated Storybook nav data, e.g.
`grep -ril "ticket-selector" storybook-static` after the build).

- [ ] **Step 5: Accessibility audit**

Run: `pnpm audit`
Expected: exits 0; open `dist/audit.json` and confirm there are no new axe-core
violations for `events/ticket-card` or `events/ticket-selector` (look for entries
keyed by those component ids; any violation must be fixed in `template.html` or
`behavior.js` before this task is considered done).

- [ ] **Step 6: Commit (only if Step 5 required fixes)**

```bash
git add components/events
git commit -m "Fix accessibility issues found in events components audit"
```

Skip this step if Step 5 found no violations.

- [ ] **Step 7: Capture screenshots**

Run: `pnpm screenshots`
Expected: exits 0; `components/events/ticket-card/screenshots/` and
`components/events/ticket-selector/screenshots/` each contain 16 PNGs
(4 themes × 4 breakpoints), matching the pattern in
`components/dashboard/stat-card/screenshots/`.

- [ ] **Step 8: Commit screenshots**

```bash
git add components/events/ticket-card/screenshots components/events/ticket-selector/screenshots
git commit -m "Add screenshots for events components"
```

---

### Task 6: Manual interaction verification

**Files:** None created — manual verification only.

**Interfaces:**
- Consumes: the running `pnpm preview:dev` server and the components built in
  Tasks 2–4.

- [ ] **Step 1: Start the preview server**

Run: `pnpm preview:dev` (leave running in the background)
Expected: server listening on `http://localhost:4321`.

- [ ] **Step 2: Navigate to the ticket-selector preview page**

Using the agent-browser skill (or a manual browser), open
`http://localhost:4321` and navigate to the `ticket-selector` component (search or
the Events category in the nav dropdown — added in Task 1).

- [ ] **Step 3: Verify quantity + total interaction**

Click the `+` button on the "General admission" tier's stepper twice.
Expected: the quantity shows `2`, `.ticket-selector__total` updates to `$98.00`
(2 × $49), and the `Checkout` button becomes enabled (no longer greyed out /
clickable).

- [ ] **Step 4: Verify sold-out tier is inert**

Confirm the "VIP balcony" tier shows a "Sold out" badge and its `+`/`−` buttons do
not respond to clicks (quantity stays `0`).

- [ ] **Step 5: Verify zeroing out disables checkout again**

Click `−` on "General admission" twice to return its quantity to `0`.
Expected: total returns to `$0.00` and the `Checkout` button becomes disabled again.

- [ ] **Step 6: Check all 4 themes**

Use the theme switcher in the preview nav to cycle through simple, futuristic,
classic, and smooth.
Expected: the ticket-selector and ticket-card render correctly (readable text,
visible borders/badges, no layout breakage) in all four.

- [ ] **Step 7: Stop the preview server**

Stop the background `pnpm preview:dev` process.

---

## Verification Checklist (spec coverage)

- [x] `ticket-card` props/variants/slots — Task 2, Step 1.
- [x] `ticket-card` stepper + clamp + sold-out lock + bubbling event — Task 2, Step 3.
- [x] `ticket-card` accessibility (aria-labels, aria-disabled) — Task 2, Steps 2–3.
- [x] `ticket-selector` props/slots — Task 4, Step 1.
- [x] `ticket-selector` stateless total recompute + checkout enable/disable —
      Task 4, Step 3.
- [x] `relationships` metadata both directions — Task 2 Step 4, Task 4 Step 4.
- [x] Sold-out badge via variant class-map (no equality-test directive) — Task 2
      Step 1 (`variants.status`) + Step 2 (`{{ status@class }}` on the badge only).
- [x] Build/test/catalog/audit/screenshots verification — Tasks 3, 5.
- [x] Manual interaction + 4-theme check — Task 6.

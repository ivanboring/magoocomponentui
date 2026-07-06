# Catalog cross-listing via derived secondary categories

**Date:** 2026-07-06
**Status:** Approved (design), pending implementation plan
**Scope:** Catalog build (`packages/schema`) + Astro preview navigation. No component authoring.

## Problem

Every component has exactly one primary `category` + one `subcategory`, and the preview's
single category dropdown filters components by their one `data-cat`/`data-sub`. So a component
is reachable through exactly one grouping. Many components that *are* cards, nav, overlays, or
forms live under a domain category (Music, Automotive, Billing, …) and therefore never appear
under the natural cross-cutting grouping. Concretely: 85 components are tagged
`usage_type: card` but only 20 live in the `Cards` category, so ~65 cards are missing from
"Cards". The same holds for nav (50 tagged / 14 native), overlay (27 / 12), and form (103 / 12).

## Goal

Let a component surface in **additional** category groupings beyond its one primary home, so
that selecting e.g. "Cards" in the catalog shows every card regardless of its domain — without
hand-editing every component and without changing where the component primarily lives.

## Decisions (agreed)

1. **Source of secondary membership: auto-derived from the existing `usage_type` array.** No new
   authored metadata field. This cross-lists all already-tagged components instantly and applies
   to future components for free.
2. **Presentation: folded into the existing category dropdown** (multi-valued category
   membership), not a separate "Collections" filter control. Reuses the current single-dropdown
   UI.
3. **Seed mapping** (`usage_type` → category):
   `card → Cards`, `nav → Navigation`, `overlay → Overlays`, `form → Forms`.
   All four targets are existing categories. The map is a single source of truth, trivially
   extendable later.
4. **Secondary membership is category-level only.** Derived members surface under
   "<Category> — all", never under a specific subcategory they don't actually belong to.
5. **No metadata schema change.** `metadata.schema.js` is untouched; `secondary_categories` is a
   *derived catalog field*, not authored.

## Design

### 1. Build — `packages/schema/src/catalog.js`

- Add an exported constant:
  ```js
  export const USAGE_COLLECTIONS = { card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" };
  ```
- Add a pure helper that derives an entry's secondary categories from its categorization:
  ```js
  export function deriveSecondaryCategories(categorization) {
    const primary = categorization?.category;
    const usage = categorization?.usage_type || [];
    const out = [];
    for (const u of usage) {
      const target = USAGE_COLLECTIONS[u];
      if (target && target !== primary && !out.includes(target)) out.push(target);
    }
    return out;
  }
  ```
  - **Self-skip:** a component whose primary category equals the target (a native `Cards` card
    tagged `card`) does not self-list.
  - **Dedup:** multiple mapped tags (e.g. `[overlay, form]`) yield `["Overlays", "Forms"]` once.
- `buildEntry` sets a new derived field on each entry:
  `secondary_categories: deriveSecondaryCategories(metadata.categorization)` (a `string[]`;
  empty array when none). The primary `categorization` is copied through unchanged.
- `deriveFacets` folds secondary categories into the `categories` facet map so the dropdown
  options reflect them. For each entry, in addition to the existing
  `categories[c.category] ||= new Set(); if (c.subcategory) categories[c.category].add(sub)`,
  also `for (const s of e.secondary_categories || []) categories[s] ||= new Set();`. Derived
  members add **no** subcategory to the target set (category-level only). Targets that already
  exist as categories (all four seeds) simply gain no new subcategories; a future target with no
  native members would still get an (empty-subcategory) entry so it appears in the dropdown.

### 2. Preview index — `preview/src/pages/index.astro`

- Each component card currently carries `data-cat`, `data-sub`, `data-atomic`, `data-search`.
  Add `data-cats` = the pipe-joined membership list `[primary, ...secondary_categories]`
  (pipe delimiter is safe — category names contain spaces but never `|`). Keep `data-cat`
  (primary) and `data-sub` as-is for subcategory filtering.
- Update the client `matches()` filter so category matching is membership-aware while
  subcategory matching stays scoped to the primary home:
  ```js
  const [cat, sub] = (catSelect.value || "").split("::");
  const cats = (card.dataset.cats || "").split("|");
  let catOk;
  if (!cat) catOk = true;
  else if (sub) catOk = card.dataset.cat === cat && card.dataset.sub === sub; // specific sub → primary only
  else catOk = cats.includes(cat);                                            // "— all" → any membership
  return (!q || card.dataset.search.includes(q)) && catOk &&
    (!hideAtoms.checked || card.dataset.atomic !== "atom");
  ```
  (The previous standalone `(!sub || card.dataset.sub === sub)` clause is folded into `catOk`.)
- Each component still renders exactly one card and one detail page. Cross-listing only affects
  which category filter values reveal it; a component never appears twice in the grid at once.

### 3. Detail page — `preview/src/pages/c/[...id].astro`

- When `entry.secondary_categories` is non-empty, render a small "Also in: Cards, …" badge row
  (styled like the existing category/atomic badges) so the cross-listing is discoverable from
  the component page. Purely additive; no behavior.

### 4. Tests — `packages/schema/*.test.mjs`

Add cases:
- `deriveSecondaryCategories` maps tags to targets, skips the self-category, dedups across
  multiple mapped tags, and returns `[]` for unmapped/absent `usage_type`.
- `buildEntry` populates `secondary_categories` on the entry.
- `deriveFacets` includes a derived target as a category key and does not add a spurious
  subcategory for a derived-only member.

## Edge cases

- **Native member of a target category** (primary = Cards, tagged `card`): excluded from its own
  secondary list (self-skip) — no duplicate/no self-reference.
- **Subcategory-name collision:** because specific-subcategory filtering is restricted to the
  primary category, a derived member can never leak into a target subcategory that merely shares
  a name with its primary subcategory.
- **Unmapped usage_types** (`stat`, `media`, `table`, …): ignored — only the four seeded tags
  produce cross-listings. Adding more later is a one-line map edit + a rebuild.
- **Multiple targets per component** (`[overlay, form]`): appears under Overlays and Forms.

## Out of scope

- No separate "Collections" filter control (rejected in favor of folding into the dropdown).
- No authored `also_in` metadata field.
- No secondary *subcategory* granularity (secondary membership is category-level by decision).
- No changes to the container-vs-leaf-card preview dropdown (uses `usage_type` includes `card`,
  unaffected).

## Files touched

| File | Change |
|---|---|
| `packages/schema/src/catalog.js` | `USAGE_COLLECTIONS`, `deriveSecondaryCategories`, entry field, `deriveFacets` fold |
| `packages/schema/src/index.js` | re-export the new symbols if the barrel lists exports |
| `preview/src/pages/index.astro` | `data-cats` attribute + membership-aware `matches()` |
| `preview/src/pages/c/[...id].astro` | "Also in" badge row |
| `packages/schema/*.test.mjs` | derivation + facet tests |
| `docs/taxonomy.md` | document that `usage_type` now also drives derived cross-listings via `USAGE_COLLECTIONS` |

## Verification

- `pnpm build` → inspect `dist/catalog.json`: a Music `card-podcast` entry has
  `secondary_categories: ["Cards"]`; `facets.categories.Cards` still lists only native Cards
  subcategories.
- `pnpm test` green including new cases.
- `pnpm preview:build` + serve → selecting **Cards — all** shows natives + derived (e.g.
  `card-podcast`, `dealer-card`); selecting **Cards › <a native sub>** shows only natives;
  detail page of a derived member shows the "Also in: Cards" badge. Confirm via `agent-browser`.

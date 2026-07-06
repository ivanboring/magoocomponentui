# Catalog Cross-Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a component surface in additional category groupings (Cards, Navigation, Overlays, Forms) derived from its existing `usage_type` tags, folded into the preview's category dropdown.

**Architecture:** Pure build-time derivation in `packages/schema/src/catalog.js` adds a `secondary_categories` field to each catalog entry and folds those into the category facet map. The Astro preview reads that field to make the single category dropdown membership-aware and to show an "Also in" badge on detail pages. No metadata schema change; no per-component authoring.

**Tech Stack:** Node ESM, `node:test` (unit tests), Astro (static preview), Tailwind v4.

## Global Constraints

- **No metadata schema change.** `packages/schema/src/metadata.schema.js` is NOT touched. `secondary_categories` is a derived catalog field, never authored.
- **Seed map is exactly:** `{ card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" }`.
- **Self-skip:** a component whose primary `category` equals a mapped target does not list itself.
- **Category-level only:** derived membership adds NO subcategory; specific-subcategory filtering stays scoped to the primary category.
- **Pipe delimiter** for the `data-cats` attribute (category names contain spaces, never `|`).
- Commit after each task. Never push. Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Derive secondary categories in the catalog builder

**Files:**
- Modify: `packages/schema/src/catalog.js` (add map + helper; extend `buildEntry` ~line 41; extend `deriveFacets` ~line 85-90)
- Modify: `packages/schema/src/index.js:3` (re-export new symbols)
- Test: `packages/schema/src/schema.test.mjs` (append cases; update one existing assertion)

**Interfaces:**
- Produces: `USAGE_COLLECTIONS` (`Record<string,string>`), `deriveSecondaryCategories(categorization) => string[]`, and a new entry field `secondary_categories: string[]` on every object returned by `buildEntry`. `deriveFacets(entries).categories` gains a key per derived target (with an empty subcategory array when the target has no native members).
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing tests**

Append to `packages/schema/src/schema.test.mjs` (the file already imports `buildEntry, deriveFacets, assembleCatalog` from `./catalog.js` at line 4 — extend that import to add the two new symbols):

```js
// change line 4 to:
import { buildEntry, deriveFacets, assembleCatalog, deriveSecondaryCategories, USAGE_COLLECTIONS } from "./catalog.js";
```

Append these tests at the end of the file:

```js
test("USAGE_COLLECTIONS has the four seeded mappings", () => {
  assert.deepEqual(USAGE_COLLECTIONS, { card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" });
});

test("deriveSecondaryCategories maps usage_type to collections, skips self, dedups, ignores unmapped", () => {
  // mapped tag from a different primary → cross-list; unmapped tag ignored
  assert.deepEqual(deriveSecondaryCategories({ category: "Music", usage_type: ["card", "media"] }), ["Cards"]);
  // native member of the target does not self-list
  assert.deepEqual(deriveSecondaryCategories({ category: "Cards", usage_type: ["card"] }), []);
  // multiple mapped tags → multiple targets, deduped
  assert.deepEqual(deriveSecondaryCategories({ category: "Auth", usage_type: ["overlay", "form", "form"] }), ["Overlays", "Forms"]);
  // no mapped tags → empty
  assert.deepEqual(deriveSecondaryCategories({ category: "Data", usage_type: ["stat", "table"] }), []);
  // missing usage_type → empty (no throw)
  assert.deepEqual(deriveSecondaryCategories({ category: "Data" }), []);
});

test("buildEntry derives secondary_categories from usage_type", () => {
  const entry = buildEntry({
    id: "music/card-podcast", path: "p",
    def: { name: "card-podcast", props: [], slots: [] },
    metadata: { ...good, categorization: { category: "Music", subcategory: "Players", atomic_type: "molecule", usage_type: ["card"], maturity: "ai-generated" } },
  });
  assert.deepEqual(entry.secondary_categories, ["Cards"]);
});

test("deriveFacets folds secondary categories in without a spurious subcategory", () => {
  const music = buildEntry({
    id: "music/card-podcast", path: "p",
    def: { name: "card-podcast", props: [], slots: [] },
    metadata: { category: "Music", subcategory: "Players", atomic_type: "molecule", usage_type: ["card"], maturity: "ai-generated", short_description: "x", use_cases: ["a","b","c","d","e"], lifecycle: "stable" },
  });
  const cat = assembleCatalog([music]);
  assert.deepEqual(cat.facets.categories.Music, ["Players"]); // primary keeps its subcategory
  assert.deepEqual(cat.facets.categories.Cards, []);          // derived target present, no sub
});
```

Also UPDATE the existing test `"deriveFacets and assembleCatalog produce nav facets"` (near line 74): its `good` fixture is `category: "Sports", usage_type: ["card", "highlight"]`, so it now derives a `Cards` secondary. Change its categories assertion from:

```js
  assert.deepEqual(cat.facets.categories, { Sports: ["Live"] });
```

to:

```js
  assert.deepEqual(cat.facets.categories, { Cards: [], Sports: ["Live"] });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test 2>&1 | grep -E "fail|not ok|deriveSecondary|USAGE_COLLECTIONS"`
Expected: FAIL — `deriveSecondaryCategories`/`USAGE_COLLECTIONS` are not exported (import error / undefined), and the updated facet assertion fails against current code.

- [ ] **Step 3: Add the map + helper and wire them into `catalog.js`**

In `packages/schema/src/catalog.js`, add after the `titleCaseName` helper (after line 14):

```js
/** usage_type → the category a component is also cross-listed under. Extend to add collections. */
export const USAGE_COLLECTIONS = { card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" };

/**
 * Derive the extra categories a component appears under, from its usage_type tags.
 * Skips the component's own primary category and dedups.
 * @param {any} categorization
 * @returns {string[]}
 */
export function deriveSecondaryCategories(categorization) {
  const primary = categorization && categorization.category;
  const usage = (categorization && categorization.usage_type) || [];
  const out = [];
  for (const u of usage) {
    const target = USAGE_COLLECTIONS[u];
    if (target && target !== primary && !out.includes(target)) out.push(target);
  }
  return out;
}
```

In `buildEntry`, add the field right after the `categorization:` line (line 41):

```js
    categorization: metadata.categorization,
    secondary_categories: deriveSecondaryCategories(metadata.categorization),
```

In `deriveFacets`, inside the `for (const e of entries)` loop, add after the `if (c.category) { ... }` block (after line 90):

```js
    for (const s of e.secondary_categories || []) categories[s] ||= new Set();
```

- [ ] **Step 4: Re-export from the barrel**

In `packages/schema/src/index.js`, change line 3 to:

```js
export { buildEntry, deriveFacets, assembleCatalog, linkRelationships, deriveSecondaryCategories, USAGE_COLLECTIONS } from "./catalog.js";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test 2>&1 | tail -5`
Expected: PASS — all tests (36 existing + 4 new) pass, 0 fail.

- [ ] **Step 6: Rebuild the catalog and spot-check the derived field**

Run: `pnpm build && node -e "const c=require('./dist/catalog.json'); const p=c.components.find(x=>x.id==='cards/card-podcast'); console.log('podcast primary:', p.categorization.category, 'secondary:', p.secondary_categories); const m=c.components.find(x=>x.categorization.category!=='Cards' && (x.categorization.usage_type||[]).includes('card')); console.log('a non-Cards card:', m.id, '→', m.secondary_categories); console.log('Cards facet subs:', c.facets.categories.Cards);"`
Expected: `cards/card-podcast` (a native) shows `secondary: []`; a non-Cards card (e.g. `automotive/dealer-card`) shows `→ [ 'Cards' ]`; `Cards facet subs` still lists only native Cards subcategories (no derived pollution).

- [ ] **Step 7: Commit**

```bash
git add packages/schema/src/catalog.js packages/schema/src/index.js packages/schema/src/schema.test.mjs
git commit -m "feat(catalog): derive secondary_categories from usage_type

Cross-list components into Cards/Navigation/Overlays/Forms based on their
usage_type tags; fold derived targets into the category facet map.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Make the preview category dropdown membership-aware

**Files:**
- Modify: `preview/src/pages/index.astro` (card render ~line 84-91; `matches()` ~line 155-162)

**Interfaces:**
- Consumes: `c.secondary_categories` (from Task 1) on each catalog component.
- Produces: a `data-cats` attribute on each grid card and a membership-aware `matches()`.

- [ ] **Step 1: Add the `data-cats` attribute to each grid card**

In `preview/src/pages/index.astro`, in the `cards.map((c) => (` `<a>` element, add a `data-cats` attribute alongside the existing `data-cat` (after line 87):

```jsx
        data-cat={c.categorization.category}
        data-cats={[c.categorization.category, ...(c.secondary_categories || [])].join("|")}
        data-sub={c.categorization.subcategory || ""}
```

- [ ] **Step 2: Make `matches()` membership-aware**

Replace the `matches()` function body (lines 155-162) with:

```js
    function matches(card) {
      const q = (search.value || "").trim().toLowerCase();
      const [cat, sub] = (catSelect.value || "").split("::");
      const cats = (card.dataset.cats || card.dataset.cat || "").split("|");
      let catOk;
      if (!cat) catOk = true;
      else if (sub) catOk = card.dataset.cat === cat && card.dataset.sub === sub; // specific sub → primary home only
      else catOk = cats.includes(cat);                                            // "— all" → any membership
      return (!q || card.dataset.search.includes(q)) && catOk &&
        (!hideAtoms.checked || card.dataset.atomic !== "atom");
    }
```

- [ ] **Step 3: Rebuild the preview**

Run: `pnpm build && rm -rf preview/.astro preview/dist && pnpm preview:build 2>&1 | tail -2`
Expected: `[build] Complete!` with no errors.

- [ ] **Step 4: Verify cross-listing in a browser**

Kill any stale server, serve, and drive it:

```bash
ss -ltnp 2>/dev/null | grep :4321 | grep -oP 'pid=\K[0-9]+' | xargs -r kill -9 2>/dev/null; sleep 0.5
nohup preview/node_modules/.bin/astro preview --root preview --port 4321 >/tmp/astro.log 2>&1 &
sleep 3
agent-browser close --all >/dev/null 2>&1
agent-browser open "http://localhost:4321/" >/dev/null 2>&1
agent-browser wait 1000 >/dev/null 2>&1
```

Then run this in-page check (selects "Cards — all" and confirms a non-Cards-primary card is now visible):

```bash
agent-browser eval '(() => {
  const sel = document.querySelector("select"); // category dropdown
  sel.value = "Cards"; sel.dispatchEvent(new Event("change", { bubbles: true }));
  const cards = [...document.querySelectorAll("#grid .card:not(.hidden)")];
  const ids = cards.map(c => c.getAttribute("href"));
  return {
    visibleCount: cards.length,
    hasNativeCard: ids.some(h => h.includes("/cards/card-podcast")),
    hasDerivedCard: ids.some(h => h.includes("/automotive/dealer-card") || h.includes("/billing/payment-method-card")),
  };
})()'
```
Expected: `hasNativeCard: true` AND `hasDerivedCard: true` (a card whose primary category is not "Cards" now appears under Cards). Then clean up: `ss -ltnp | grep :4321 | grep -oP 'pid=\K[0-9]+' | xargs -r kill -9; agent-browser close --all`.

- [ ] **Step 5: Commit**

```bash
git add preview/src/pages/index.astro
git commit -m "feat(preview): fold derived secondary categories into the category filter

Cards carry data-cats (primary + secondary); matches() treats a category
selection as membership so e.g. Cards shows every card, while a specific
subcategory stays scoped to the primary home.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Show an "Also in" badge on the detail page

**Files:**
- Modify: `preview/src/pages/c/[...id].astro` (after the short_description `<p>`, ~line 80)

**Interfaces:**
- Consumes: `entry.secondary_categories` (from Task 1).

- [ ] **Step 1: Add the badge row**

In `preview/src/pages/c/[...id].astro`, immediately after the `<p class="mt-2 max-w-2xl text-slate-600">{entry.short_description}</p>` line (line 80), add:

```jsx
  {entry.secondary_categories && entry.secondary_categories.length > 0 && (
    <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>Also in:</span>
      {entry.secondary_categories.map((s) => (
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{s}</span>
      ))}
    </div>
  )}
```

- [ ] **Step 2: Rebuild and verify the badge renders**

Run: `pnpm preview:build 2>&1 | tail -1` then serve as in Task 2 Step 4 and check a derived card's detail page:

```bash
agent-browser open "http://localhost:4321/c/automotive/dealer-card" >/dev/null 2>&1; agent-browser wait 800 >/dev/null 2>&1
agent-browser eval 'document.body.innerText.includes("Also in:") && document.body.innerText.match(/Also in:[\s\S]{0,40}Cards/) ? "BADGE OK" : "MISSING"'
```
Expected: `"BADGE OK"`. Then a native Cards component should NOT show it:

```bash
agent-browser open "http://localhost:4321/c/cards/card-podcast" >/dev/null 2>&1; agent-browser wait 800 >/dev/null 2>&1
agent-browser eval 'document.body.innerText.includes("Also in:") ? "UNEXPECTED" : "CORRECT (no badge)"'
```
Expected: `"CORRECT (no badge)"`. Clean up the server + browser afterward.

- [ ] **Step 3: Commit**

```bash
git add preview/src/pages/c/[...id].astro
git commit -m "feat(preview): show 'Also in' secondary-category badges on detail pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Document the derived cross-listing in the taxonomy

**Files:**
- Modify: `docs/taxonomy.md` (add a short subsection under the `usage_type` description)

- [ ] **Step 1: Add the documentation**

In `docs/taxonomy.md`, find the `usage_type` section and append a paragraph:

```markdown
### Derived cross-listing (secondary categories)

`usage_type` is not only a tag vocabulary — a curated map in
`packages/schema/src/catalog.js` (`USAGE_COLLECTIONS`) turns certain tags into
**secondary category memberships** so a component shows up under a cross-cutting
grouping in addition to its one primary `category`. Current map:
`card → Cards`, `nav → Navigation`, `overlay → Overlays`, `form → Forms`. The
build derives `secondary_categories` per component (skipping its own primary
category); the preview folds these into the category dropdown so e.g. selecting
**Cards** lists every `card`-tagged component regardless of its domain.
Membership is category-level only — a specific subcategory filter still shows a
component only under its primary home. Add a collection by extending the map and
rebuilding — no per-component or schema change needed.
```

- [ ] **Step 2: Commit**

```bash
git add docs/taxonomy.md
git commit -m "docs(taxonomy): document derived secondary-category cross-listing

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Build derivation (`USAGE_COLLECTIONS`, `deriveSecondaryCategories`, entry field, facet fold) → Task 1. ✓
- Preview dropdown membership + `data-cats` → Task 2. ✓
- Detail-page "Also in" badge → Task 3. ✓
- Tests (derivation, self-skip, dedup, facet fold) → Task 1 Step 1. ✓
- `docs/taxonomy.md` update → Task 4. ✓
- No schema change → honored (Global Constraints; no task touches the schema). ✓
- Category-level only / subcategory scoped to primary → Task 2 Step 2 `matches()`. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code and exact commands. ✓

**Type consistency:** `deriveSecondaryCategories(categorization) => string[]` and the `secondary_categories` field name are used identically in Tasks 1–3; `data-cats` pipe-joined and split consistently in Task 2. The existing-test update (Cards facet key) is called out in Task 1 Step 1 to avoid a false failure. ✓

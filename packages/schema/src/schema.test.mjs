import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMetadata } from "./validate.js";
import { buildEntry, deriveFacets, assembleCatalog, deriveSecondaryCategories, USAGE_COLLECTIONS } from "./catalog.js";

const good = {
  short_description: "A live match score card.",
  use_cases: ["a", "b", "c", "d", "e"],
  lifecycle: "stable",
  categorization: {
    category: "Sports",
    subcategory: "Live",
    atomic_type: "molecule",
    usage_type: ["card", "highlight"],
    maturity: "ai-generated",
    text_direction: "both",
    seo_score: 70,
  },
};

test("validateMetadata accepts a well-formed record", () => {
  const res = validateMetadata(good);
  assert.equal(res.valid, true, res.errors.join("; "));
});

test("validateMetadata rejects a bad lifecycle enum", () => {
  const res = validateMetadata({ ...good, lifecycle: "wip" });
  assert.equal(res.valid, false);
  assert.match(res.errors.join(" "), /lifecycle/);
});

test("validateMetadata requires categorization", () => {
  const { categorization, ...rest } = good;
  const res = validateMetadata(rest);
  assert.equal(res.valid, false);
});

test("validateMetadata enforces 5-15 use_cases", () => {
  const res = validateMetadata({ ...good, use_cases: ["only", "three", "here"] });
  assert.equal(res.valid, false);
});

test("buildEntry merges def types with metadata prose", () => {
  const def = {
    name: "match-card",
    props: [{ name: "score", type: "string", required: true }],
    slots: [{ name: "footer", title: "Footer", description: "" }],
  };
  const metadata = { ...good, props: { score: "Home–away score." }, slots: { footer: "Extra info." } };
  const entry = buildEntry({ id: "sports/match-card", path: "components/sports/match-card", def, metadata });
  assert.equal(entry.props[0].usage, "Home–away score.");
  assert.equal(entry.slots[0].usage, "Extra info.");
  assert.equal(entry.short_description, good.short_description);
});

test("assembleCatalog resolves relationships and derives reverse links", () => {
  const band = buildEntry({
    id: "dashboard/stats-band", path: "p",
    def: { name: "stats-band", props: [], slots: [] },
    metadata: { ...good, relationships: { children: ["stat-card"] } },
  });
  const card = buildEntry({
    id: "dashboard/stat-card", path: "p",
    def: { name: "stat-card", props: [], slots: [] },
    metadata: good,
  });
  const cat = assembleCatalog([band, card]);
  const b = cat.components.find((c) => c.id === "dashboard/stats-band");
  const c = cat.components.find((c) => c.id === "dashboard/stat-card");
  assert.deepEqual(b.relationships.children, ["dashboard/stat-card"]); // name → id
  assert.deepEqual(c.relationships.parents, ["dashboard/stats-band"]); // reverse derived
});

test("deriveFacets and assembleCatalog produce nav facets", () => {
  const entry = buildEntry({
    id: "sports/match-card",
    path: "p",
    def: { name: "match-card", props: [], slots: [] },
    metadata: good,
  });
  const cat = assembleCatalog([entry], { generatedAt: "t" });
  assert.equal(cat.count, 1);
  assert.deepEqual(cat.facets.categories, { Cards: [], Sports: ["Live"] });
  assert.deepEqual(cat.facets.atomic_types, ["molecule"]);
  assert.deepEqual(cat.facets.usage_types, ["card", "highlight"]);
});

test("USAGE_COLLECTIONS has the four seeded mappings", () => {
  assert.deepEqual(USAGE_COLLECTIONS, { card: "Cards", nav: "Navigation", overlay: "Overlays", form: "Forms" });
});

test("deriveSecondaryCategories maps usage_type to collections, skips self, dedups, ignores unmapped", () => {
  assert.deepEqual(deriveSecondaryCategories({ category: "Music", usage_type: ["card", "media"] }), ["Cards"]);
  assert.deepEqual(deriveSecondaryCategories({ category: "Cards", usage_type: ["card"] }), []);
  assert.deepEqual(deriveSecondaryCategories({ category: "Auth", usage_type: ["overlay", "form", "form"] }), ["Overlays", "Forms"]);
  assert.deepEqual(deriveSecondaryCategories({ category: "Data", usage_type: ["stat", "table"] }), []);
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
    metadata: { ...good, categorization: { category: "Music", subcategory: "Players", atomic_type: "molecule", usage_type: ["card"], maturity: "ai-generated" } },
  });
  const cat = assembleCatalog([music]);
  assert.deepEqual(cat.facets.categories.Music, ["Players"]);
  assert.deepEqual(cat.facets.categories.Cards, []);
});

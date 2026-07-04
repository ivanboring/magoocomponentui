import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMetadata } from "./validate.js";
import { buildEntry, deriveFacets, assembleCatalog } from "./catalog.js";

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
  assert.deepEqual(cat.facets.categories, { Sports: ["Live"] });
  assert.deepEqual(cat.facets.atomic_types, ["molecule"]);
  assert.deepEqual(cat.facets.usage_types, ["card", "highlight"]);
});

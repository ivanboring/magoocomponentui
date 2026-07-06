import { test } from "node:test";
import assert from "node:assert/strict";
import { searchComponents } from "./search.mjs";

const all = [
  { id: "cards/card-pricing", metadata: { name: "Pricing Card", short_description: "A pricing plan card.", use_cases: ["pricing"], categorization: { category: "Cards", subcategory: "Commerce", usage_type: ["card"], atomic_type: "organism" }, lifecycle: "experimental" } },
  { id: "auth/login-form", metadata: { name: "Login Form", short_description: "A sign-in form.", use_cases: [], categorization: { category: "Auth", usage_type: ["form"], atomic_type: "molecule" }, lifecycle: "stable" } },
];

test("filters by free-text query across name/description/use_cases", () => {
  assert.deepEqual(searchComponents(all, { q: "pricing" }).map((r) => r.id), ["cards/card-pricing"]);
});
test("filters by category and usage", () => {
  assert.deepEqual(searchComponents(all, { category: "Auth" }).map((r) => r.id), ["auth/login-form"]);
  assert.deepEqual(searchComponents(all, { usage: "card" }).map((r) => r.id), ["cards/card-pricing"]);
});
test("no filters returns all", () => {
  assert.equal(searchComponents(all, {}).length, 2);
});

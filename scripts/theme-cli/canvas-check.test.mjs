import { test } from "node:test";
import assert from "node:assert/strict";
import { canvasEligibility } from "../../packages/generator/src/canvas.js";
import { canvasCheck } from "./canvas-check.mjs";
import { loadComponentDef } from "./config.mjs";

test("a real catalog component with an array-of-object prop is NOT Canvas-eligible", async () => {
  // marketing/feature-grid loops `data-for="item in items"` over objects — Drupal Canvas has no
  // field type for {"type":"array","items":{"type":"object"}}.
  const { eligible, reasons, blockingProps } = canvasEligibility(await loadComponentDef("marketing/feature-grid"));
  assert.equal(eligible, false);
  assert.deepEqual(blockingProps, ["items"]);
  assert.match(reasons[0], /array.*object/);
  assert.match(reasons[0], /paragraph/); // the message names the fallback
});

test("real slot-based / scalar-prop catalog components ARE Canvas-eligible", async () => {
  for (const id of ["cards/card-grid", "dashboard/stat-card", "dashboard/stats-band", "layout/section-wrapper"]) {
    const { eligible, reasons } = canvasEligibility(await loadComponentDef(id));
    assert.equal(eligible, true, `${id} should be Canvas-eligible: ${reasons.join(" ")}`);
  }
});

test("a bare object prop is not Canvas-eligible", () => {
  const { eligible, blockingProps } = canvasEligibility({
    name: "x", props: [{ name: "config", type: "object" }, { name: "title", type: "string" }],
  });
  assert.equal(eligible, false);
  assert.deepEqual(blockingProps, ["config"]);
});

test("arrays of scalars are fine (multi-cardinality field)", () => {
  const { eligible } = canvasEligibility({ name: "x", props: [{ name: "tags", type: "array", items: "string" }] });
  assert.equal(eligible, true);
});

test("canvasCheck reports per-id eligibility", async () => {
  const rows = await canvasCheck(["dashboard/stat-card", "marketing/feature-grid"]);
  assert.deepEqual(rows.map((r) => [r.id, r.eligible]), [
    ["dashboard/stat-card", true],
    ["marketing/feature-grid", false],
  ]);
});

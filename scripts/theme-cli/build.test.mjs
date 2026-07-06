import { test } from "node:test";
import assert from "node:assert/strict";
import { filesForTarget } from "./build.mjs";

const files = {
  "sdc/card-x/card-x.component.yml": "a",
  "sdc/card-x/card-x.twig": "b",
  "code-component/card-x.jsx": "c",
  "react/card-x.jsx": "d",
  "drupal/config/paragraphs.paragraphs_type.card_x.yml": "e",
};

test("selects only the SDC files for target sdc", () => {
  assert.deepEqual(Object.keys(filesForTarget(files, "sdc")).sort(), ["sdc/card-x/card-x.component.yml", "sdc/card-x/card-x.twig"]);
});
test("selects the code-component file for target code-component", () => {
  assert.deepEqual(Object.keys(filesForTarget(files, "code-component")), ["code-component/card-x.jsx"]);
});
test("throws on unknown target", () => {
  assert.throws(() => filesForTarget(files, "svelte"), /unknown target/i);
});

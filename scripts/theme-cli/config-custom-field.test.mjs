import { test } from "node:test";
import assert from "node:assert/strict";
import yaml from "js-yaml";
import { customFieldConfigFiles, columnTypeFor } from "./config-custom-field.mjs";

const def = { name: "card-x", props: [
  { name: "title", type: "string" }, { name: "count", type: "integer" },
  { name: "featured", type: "boolean" }, { name: "href", type: "link" },
]};

test("maps prop types to custom_field column types", () => {
  assert.equal(columnTypeFor("string"), "string");
  assert.equal(columnTypeFor("integer"), "integer");
  assert.equal(columnTypeFor("boolean"), "boolean");
  assert.equal(columnTypeFor("link"), "uri");
});

test("emits storage + field bound to the entity/bundle with a column per scalar prop", () => {
  const out = customFieldConfigFiles(def, { entity: "node", bundle: "article" });
  const storageKey = "drupal/config/field.storage.node.field_card_x.yml";
  const fieldKey = "drupal/config/field.field.node.article.field_card_x.yml";
  assert.ok(out[storageKey], "storage file present");
  assert.ok(out[fieldKey], "field file present");
  const storage = yaml.load(out[storageKey]);
  assert.equal(storage.type, "custom_field");
  assert.equal(storage.entity_type, "node");
  assert.deepEqual(Object.keys(storage.settings.columns).sort(), ["count", "featured", "href", "title"]);
  const field = yaml.load(out[fieldKey]);
  assert.equal(field.entity_type, "node");
  assert.equal(field.bundle, "article");
});

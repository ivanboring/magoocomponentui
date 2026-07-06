import { test } from "node:test";
import assert from "node:assert/strict";
import { paragraphConfigFiles } from "./config.mjs";

const files = {
  "drupal/config/paragraphs.paragraphs_type.card_x.yml": "a",
  "drupal/config/field.storage.paragraph.field_price.yml": "b",
  "drupal/paragraph--card-x.html.twig": "c",
  "drupal/custom_field.card-x.yml": "note",
  "sdc/card-x/card-x.twig": "z",
};

test("paragraph config selects drupal config + twig, not custom_field note or sdc", () => {
  assert.deepEqual(Object.keys(paragraphConfigFiles(files)).sort(), [
    "drupal/config/field.storage.paragraph.field_price.yml",
    "drupal/config/paragraphs.paragraphs_type.card_x.yml",
    "drupal/paragraph--card-x.html.twig",
  ]);
});

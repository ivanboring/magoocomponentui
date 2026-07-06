import { test } from "node:test";
import assert from "node:assert/strict";
import { substitute, themePath } from "./create-theme.mjs";

test("substitute replaces __KEY__ tokens and leaves unknown ones", () => {
  assert.equal(substitute("name: __NAME__ / __MACHINE__ / __UNKNOWN__", { NAME: "Acme", MACHINE: "acme" }), "name: Acme / acme / __UNKNOWN__");
});

test("themePath remaps generator paths into the Drupal theme layout", () => {
  assert.equal(themePath("sdc/card-x/card-x.component.yml"), "components/card-x/card-x.component.yml");
  assert.equal(themePath("drupal/config/field.field.node.article.field_x.yml"), "config/install/field.field.node.article.field_x.yml");
  assert.equal(themePath("drupal/paragraph--card-x.html.twig"), "templates/paragraph--card-x.html.twig");
  assert.equal(themePath("code-component/card-x.jsx"), "components/card-x.jsx");
});

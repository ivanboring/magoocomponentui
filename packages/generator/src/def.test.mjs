import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDef, normalizeDef } from "./def.js";

test("loadDef normalizes props and slots into ordered arrays", () => {
  const def = loadDef(`
name: card-podcast
props:
  title: { type: string, required: true }
  variant: { type: enum, values: [default, elevated], default: default }
  items: { type: array, items: object }
slots:
  body: { title: Body, description: Main content }
`);
  assert.equal(def.name, "card-podcast");
  assert.equal(def.props.length, 3);

  const title = def.props[0];
  assert.equal(title.type, "string");
  assert.equal(title.required, true);
  assert.equal(title.title, "Title"); // derived title-case

  const variant = def.props[1];
  assert.deepEqual(variant.values, ["default", "elevated"]);
  assert.equal(variant.default, "default");

  assert.equal(def.props[2].items, "object");
  assert.deepEqual(def.slots, [{ name: "body", title: "Body", description: "Main content" }]);
});

test("normalizeDef rejects invalid prop types", () => {
  assert.throws(() => normalizeDef({ name: "x", props: { a: { type: "wat" } } }), /invalid type/);
});

test("normalizeDef requires enum values", () => {
  assert.throws(() => normalizeDef({ name: "x", props: { a: { type: "enum" } } }), /requires a non-empty/);
});

test("normalizeDef requires a name", () => {
  assert.throws(() => normalizeDef({ props: {} }), /requires a string `name`/);
});

test("normalizeDef rejects hyphenated prop names (invalid Twig identifier)", () => {
  assert.throws(() => normalizeDef({ name: "x", props: { "foo-bar": { type: "string" } } }), /not a valid identifier/);
});

test("normalizeDef rejects hyphenated slot names (invalid Twig block name)", () => {
  assert.throws(() => normalizeDef({ name: "x", slots: { "icon-leading": {} } }), /not a valid identifier/);
});

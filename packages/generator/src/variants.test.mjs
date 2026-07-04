import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDef } from "./def.js";
import { parseTemplate } from "./parser.js";
import { renderToHtml } from "./render.js";
import { generate } from "./index.js";

const def = normalizeDef({
  name: "btn",
  props: {
    label: { type: "string", required: true },
    variant: { type: "enum", values: ["primary", "ghost"], default: "primary" },
  },
  variants: {
    variant: {
      primary: "bg-primary text-primary-contrast",
      ghost: "bg-transparent text-primary",
    },
  },
});

const template = `<button class="btn {{ variant@class }}">{{ label }}</button>`;

test("normalizeDef captures the variants map", () => {
  assert.equal(def.variants.variant.primary, "bg-primary text-primary-contrast");
});

test("normalizeDef rejects a variant value not in the enum", () => {
  assert.throws(
    () => normalizeDef({ name: "x", props: { v: { type: "enum", values: ["a"] } }, variants: { v: { b: "c" } } }),
    /not one of the enum values/,
  );
});

test("normalizeDef rejects variants on a non-enum prop", () => {
  assert.throws(
    () => normalizeDef({ name: "x", props: { v: { type: "string" } }, variants: { v: { a: "b" } } }),
    /must be an enum prop/,
  );
});

test("renderToHtml resolves prop@class via $variants", () => {
  const ast = parseTemplate(template);
  const html = renderToHtml(ast, { label: "Go", variant: "ghost", $variants: def.variants });
  assert.match(html, /class="btn bg-transparent text-primary"/);
});

test("twig emits a ternary chain for prop@class", () => {
  const { files } = generate({ id: "atoms/btn", def, template });
  const twig = files["sdc/btn/btn.twig"];
  assert.match(twig, /variant == 'primary' \? 'bg-primary text-primary-contrast'/);
});

test("react/vue emit inline map expressions for prop@class", () => {
  const { files } = generate({ id: "atoms/btn", def, template });
  assert.match(files["react/btn.jsx"], /\{"primary":"bg-primary text-primary-contrast"[^}]*\}\[variant\] \|\| ""/);
  assert.match(files["vue/btn.vue"], /\{'primary':'bg-primary text-primary-contrast'[^}]*\}\[variant\] \|\| ''/);
});

test("storybook injects $variants from meta", () => {
  const { files } = generate({ id: "atoms/btn", def, template });
  assert.match(files["stories/btn.stories.js"], /\$variants: meta\.def\.variants/);
});

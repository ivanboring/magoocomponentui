import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDef } from "./def.js";
import { parseTemplate } from "./parser.js";
import { renderToHtml } from "./render.js";
import { generate } from "./index.js";

const def = normalizeDef({
  name: "demo-card",
  props: {
    title: { type: "string", required: true },
    variant: { type: "enum", values: ["default", "elevated"], default: "default" },
    image: { type: "image" },
    featured: { type: "boolean", default: false },
    items: { type: "array", items: "object" },
  },
  slots: { footer: { title: "Footer" } },
});

const template = `<article class="demo-card {{ variant }}">
  <img data-if="image" src="{{ image }}" alt="{{ title }}">
  <h3>{{ title }}</h3>
  <span data-if="featured">star</span>
  <ul><li data-for="item in items">{{ item.label }}</li></ul>
  <slot name="footer">No footer</slot>
</article>`;

const behavior = `export default function init(root, props) {
  root.addEventListener("click", () => root.classList.toggle("is-open"));
  return () => {};
}`;

test("renderToHtml interprets exprs, conditionals, loops and slots", () => {
  const ast = parseTemplate(template);
  const html = renderToHtml(ast, {
    title: "Hi",
    variant: "elevated",
    image: "x.jpg",
    featured: true,
    items: [{ label: "A" }, { label: "B" }],
    $slots: { footer: "<b>F</b>" },
  });
  assert.match(html, /class="demo-card elevated"/);
  assert.match(html, /<img src="x\.jpg" alt="Hi">/);
  assert.match(html, /<h3>Hi<\/h3>/);
  assert.match(html, /<span>star<\/span>/);
  assert.match(html, /<li>A<\/li><li>B<\/li>/);
  assert.match(html, /<b>F<\/b>/); // provided slot wins over fallback
});

test("renderToHtml hides falsy conditionals and uses slot fallback", () => {
  const ast = parseTemplate(template);
  const html = renderToHtml(ast, { title: "Hi", variant: "default", featured: false, items: [] });
  assert.doesNotMatch(html, /star/);
  assert.doesNotMatch(html, /<img/); // image absent
  assert.match(html, /No footer/);
});

test("generate emits the full target set", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  const keys = Object.keys(files);
  assert.ok(keys.includes("sdc/demo-card/demo-card.component.yml"));
  assert.ok(keys.includes("sdc/demo-card/demo-card.twig"));
  assert.ok(keys.includes("sdc/demo-card/demo-card.js"));
  assert.ok(keys.includes("code-component/demo-card.jsx"));
  assert.ok(keys.includes("react/demo-card.jsx"));
  assert.ok(keys.includes("vue/demo-card.vue"));
  assert.ok(keys.includes("stories/demo-card.stories.js"));
  assert.ok(keys.includes("ast.json"));
});

test("SDC output: JSON-Schema props, image ref, twig control structures", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  const yml = files["sdc/demo-card/demo-card.component.yml"];
  assert.match(yml, /json-schema-definitions:\/\/canvas\.module\/image/);
  assert.match(yml, /enum:/);
  assert.match(yml, /required:\n\s+- title/);
  assert.match(yml, /libraryOverrides:/); // behavior present

  const twig = files["sdc/demo-card/demo-card.twig"];
  assert.match(twig, /\{% if image %\}/);
  assert.match(twig, /\{% for item in items %\}/);
  assert.match(twig, /\{% block footer %\}No footer\{% endblock %\}/);
});

test("React JSX: className, map with key, useEffect + ref", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  const jsx = files["react/demo-card.jsx"];
  assert.match(jsx, /className=\{`demo-card \$\{variant\}`\}/);
  assert.match(jsx, /items\.map\(\(item, \$index\)/);
  assert.match(jsx, /key=\{\$index\}/);
  assert.match(jsx, /useEffect\(/);
  assert.match(jsx, /ref=\{rootRef\}/);
  assert.match(jsx, /import React, \{ useEffect, useRef \} from "react"/);
});

test("Preact code component uses jsxImportSource pragma", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  assert.match(files["code-component/demo-card.jsx"], /@jsxImportSource preact/);
});

test("Vue SFC: v-if, v-for, slot, defineProps, onMounted", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  const vue = files["vue/demo-card.vue"];
  assert.match(vue, /v-if="featured"/);
  assert.match(vue, /v-for="\(item, \$index\) in items"/);
  assert.match(vue, /<slot name="footer">No footer<\/slot>/);
  assert.match(vue, /defineProps\(\{/);
  assert.match(vue, /onMounted\(/);
});

test("Storybook story renders via renderToHtml with argTypes", () => {
  const { files } = generate({ id: "demo/demo-card", def, template, behavior });
  const story = files["stories/demo-card.stories.js"];
  assert.match(story, /renderToHtml\(ast, args\)/);
  assert.match(story, /argTypes:/);
  assert.match(story, /import "\.\.\/sdc\/demo-card\/demo-card\.js"/); // behavior loaded
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInterpolation, parseTemplate } from "./parser.js";

test("parseInterpolation splits literals, exprs and raw", () => {
  const parts = parseInterpolation("Hi {{ name }} — {{{ body }}}!");
  assert.deepEqual(parts, [
    { kind: "literal", value: "Hi " },
    { kind: "expr", path: "name" },
    { kind: "literal", value: " — " },
    { kind: "raw", path: "body" },
    { kind: "literal", value: "!" },
  ]);
});

test("parseInterpolation supports dotted paths", () => {
  const parts = parseInterpolation("{{ item.title }}");
  assert.deepEqual(parts, [{ kind: "expr", path: "item.title" }]);
});

test("parseInterpolation rejects arbitrary expressions", () => {
  assert.throws(() => parseInterpolation("{{ a + b }}"), /Invalid interpolation/);
});

test("parseTemplate builds element/text/slot nodes with directives", () => {
  const ast = parseTemplate(
    `<article class="card {{ variant }}" data-if="featured">
       <h3>{{ title }}</h3>
       <slot name="body">fallback</slot>
       <li data-for="item in items">{{ item.label }}</li>
     </article>`,
  );
  const article = ast.find((n) => n.type === "element");
  assert.equal(article.tag, "article");
  assert.deepEqual(article.directives.if, { path: "featured", negate: false });

  const classAttr = article.attrs.find((a) => a.name === "class");
  assert.deepEqual(classAttr.parts, [
    { kind: "literal", value: "card " },
    { kind: "expr", path: "variant" },
  ]);

  const slot = article.children.find((n) => n.type === "slot");
  assert.equal(slot.name, "body");
  assert.equal(slot.fallback[0].parts[0].value, "fallback");

  const li = article.children.find((n) => n.type === "element" && n.tag === "li");
  assert.deepEqual(li.directives.for, { item: "item", list: "items" });
  assert.deepEqual(li.children[0].parts, [{ kind: "expr", path: "item.label" }]);
});

test("parseTemplate supports negated data-if", () => {
  const ast = parseTemplate(`<p data-if="!featured">x</p>`);
  assert.deepEqual(ast[0].directives.if, { path: "featured", negate: true });
});

/**
 * A boolean prop consumed in a `data-*` / `aria-*` attribute must render the literal
 * strings "true"/"false" — Twig stringifies a PHP boolean to "1"/"" otherwise, which
 * never matches Tailwind's `data-[x=true]` / `data-[x=false]` variants.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTemplate } from "../parser.js";
import { astToTwig } from "./twig.js";
import { generate } from "../index.js";

const def = {
  name: "card-pricing",
  props: [
    { name: "featured", type: "boolean", title: "Featured", required: false, default: false },
    { name: "count", type: "integer", title: "Count", required: false },
    { name: "cta_href", type: "link", title: "CTA href", required: false },
    { name: "features", type: "array", items: "object", title: "Features", required: false },
  ],
  slots: [],
  variants: {},
};

test("boolean-safe stringification in data-* attributes", () => {
  const ast = parseTemplate('<a data-featured="{{ featured }}" href="{{ cta_href }}">go</a>');
  const twig = astToTwig(ast, {});
  assert.match(twig, /data-featured="\{\{ featured is same as\(true\) \? 'true' : \(featured is same as\(false\) \? 'false' : featured\) \}\}"/);
  // non data-/aria- attributes keep the plain interpolation
  assert.match(twig, /href="\{\{ cta_href \}\}"/);
});

test("boolean-safe stringification for aria-* attributes and loop vars", () => {
  const ast = parseTemplate(
    '<ul><li data-for="f in features" data-included="{{ f.included }}" aria-expanded="{{ f.open }}">x</li></ul>',
  );
  const twig = astToTwig(ast, {});
  assert.match(twig, /data-included="\{\{ f\.included is same as\(true\) \? 'true' : \(f\.included is same as\(false\) \? 'false' : f\.included\) \}\}"/);
  assert.match(twig, /aria-expanded="\{\{ f\.open is same as\(true\) \? 'true' : /);
});

test("mixed attribute values (literal + expr) still stringify booleans", () => {
  const ast = parseTemplate('<div data-state="s-{{ featured }}"></div>');
  const twig = astToTwig(ast, {});
  assert.match(twig, /data-state="s-\{\{ featured is same as\(true\)/);
});

test("data-if / data-for directives still receive the raw boolean", () => {
  const ast = parseTemplate('<span data-if="featured" data-featured="{{ featured }}">badge</span>');
  const twig = astToTwig(ast, {});
  assert.match(twig, /\{% if featured %\}/);
});

test("paragraph embed passes a real boolean (SDC schema types it boolean)", () => {
  const { files } = generate({
    id: "cards/card-pricing",
    name: "card-pricing",
    def,
    template: '<a data-featured="{{ featured }}">go</a>',
    behavior: null,
    metadata: {},
    themeMachineName: "demo_theme",
  });
  const para = files["drupal/paragraph--card-pricing.html.twig"];
  assert.match(para, /featured: paragraph\.\w+\.value \? true : false,/);
  assert.match(files["sdc/card-pricing/card-pricing.component.yml"], /type: boolean/);
  assert.match(files["sdc/card-pricing/card-pricing.twig"], /is same as\(true\) \? 'true'/);
});

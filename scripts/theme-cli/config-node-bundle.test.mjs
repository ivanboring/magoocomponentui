import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDef } from "../../packages/generator/src/def.js";
import { parseTemplate } from "../../packages/generator/src/parser.js";
import { emitNodeBundle } from "./config-node-bundle.mjs";

function build(defYaml, template) {
  const def = loadDef(defYaml);
  const ast = parseTemplate(template);
  return emitNodeBundle({ name: def.name, def, ast }, { theme: "vanilla" });
}

test("emits a node.type + one field per prop, hidden in the view display", () => {
  const { config } = build(
    "name: widget\nprops:\n  title: { type: string }\n  count: { type: integer }\nslots: {}\n",
    "<div>{{ title }}{{ count }}</div>",
  );
  assert.ok(config["node.type.widget.yml"]);
  assert.ok(config["field.storage.node.field_widget_title.yml"]);
  assert.ok(config["field.field.node.widget.field_widget_count.yml"]);
  // view display hides every field (the twig renders the component)
  assert.deepEqual(config["core.entity_view_display.node.widget.default.yml"].content, {});
});

test("enum prop defaults to its declared default in the twig (empty field would fail SDC)", () => {
  const { twig } = build(
    "name: box\nprops:\n  size: { type: enum, values: [sm, lg], default: lg }\nslots: {}\n",
    "<div>{{ size }}</div>",
  );
  assert.match(twig, /size: node\.field_box_size\.value\|default\('lg'\)/);
});

test("link prop coerces empty to '' (SDC rejects null)", () => {
  const { twig } = build(
    "name: link_card\nprops:\n  href: { type: link }\nslots: {}\n",
    '<a href="{{ href }}">x</a>',
  );
  assert.match(twig, /href: node\.field_link_card_href\.0\.url\|default\(''\)/);
});

test("array prop becomes a custom_field and is rebuilt as an array of inferred columns in twig", () => {
  const { config, twig } = build(
    "name: grid\nprops:\n  items: { type: array, items: object }\nslots: {}\n",
    '<div data-for="item in items">{{ item.badge }}{{ item.label }}</div>',
  );
  const storage = config["field.storage.node.field_grid_items.yml"];
  assert.equal(storage.type, "custom");
  assert.deepEqual(Object.keys(storage.settings.columns).sort(), ["badge", "label"]);
  assert.match(twig, /\{% for i in node\.field_grid_items %\}/);
  assert.match(twig, /badge: i\.badge/);
});

test("slot becomes a text_long field echoed into a {% block %}", () => {
  const { config, twig } = build(
    "name: note\nprops: {}\nslots:\n  body: { title: Body }\n",
    '<div><slot name="body"></slot></div>',
  );
  assert.equal(config["field.field.node.note.field_note_body.yml"].field_type, "text_long");
  assert.match(twig, /\{% block body %\}\{\{ body_slot \}\}\{% endblock %\}/);
});

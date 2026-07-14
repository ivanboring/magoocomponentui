import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDef } from "./def.js";
import { parseTemplate } from "./parser.js";
import { emitDrupalConfig } from "./emit/drupal-config.js";
import { generate } from "./index.js";

test("emits importable config entities for a paragraph bundle", () => {
  const def = normalizeDef({
    name: "demo-card",
    props: {
      title: { type: "string", required: true },
      variant: { type: "enum", values: ["a", "b"] },
      items: { type: "array", items: "object" },
    },
    slots: { footer: {} },
  });
  const ast = parseTemplate(
    `<div class="demo-card"><h3>{{ title }}</h3><li data-for="item in items">{{ item.label }}</li><slot name="footer"></slot></div>`,
  );
  const { files } = emitDrupalConfig({ name: "demo-card", def, ast });

  assert.ok(files["config/paragraphs.paragraphs_type.demo_card.yml"]);
  // Field names are namespaced by the component/bundle so unrelated components can't
  // collide on a shared field storage.
  assert.equal(files["config/field.storage.paragraph.field_demo_card_title.yml"].type, "string");
  assert.equal(files["config/field.storage.paragraph.field_demo_card_variant.yml"].type, "list_string");
  assert.deepEqual(
    files["config/field.storage.paragraph.field_demo_card_variant.yml"].settings.allowed_values.map((a) => a.value),
    ["a", "b"],
  );
  // custom_field's field-type plugin id is `custom` (module custom_field).
  assert.equal(files["config/field.storage.paragraph.field_demo_card_items.yml"].type, "custom");
  assert.equal(files["config/field.storage.paragraph.field_demo_card_footer.yml"].type, "entity_reference_revisions");
  assert.ok(files["config/core.entity_form_display.paragraph.demo_card.default.yml"]);
  const viewDisplay = files["config/core.entity_view_display.paragraph.demo_card.default.yml"];
  assert.ok(viewDisplay);
  // Scalar props are read off the entity in twig, so the view display hides them...
  assert.equal(viewDisplay.hidden.field_demo_card_title, true);
  assert.equal(viewDisplay.hidden.field_demo_card_items, true);
  // ...but SLOT fields render via content.<field> in the twig, so they must be displayed
  // (a hidden field is stripped from `content` and the slot would render empty).
  assert.equal(viewDisplay.content.field_demo_card_footer.type, "entity_reference_revisions_entity_view");
  assert.ok(viewDisplay.dependencies.module.includes("entity_reference_revisions"));

  // instance depends on its storage + the bundle
  const inst = files["config/field.field.paragraph.demo_card.field_demo_card_title.yml"];
  assert.ok(inst.dependencies.config.includes("field.storage.paragraph.field_demo_card_title"));
  assert.ok(inst.dependencies.config.includes("paragraphs.paragraphs_type.demo_card"));
});

test("maps a prop to a contrib field type with correct module deps", () => {
  const def = normalizeDef({
    name: "venue",
    props: {
      address: { type: "object", drupal: { field_type: "address" } },
      hours: { type: "object", drupal: { field_type: "office_hours" } },
    },
  });
  const ast = parseTemplate(`<div class="venue"></div>`);
  const { files } = emitDrupalConfig({ name: "venue", def, ast });

  const addr = files["config/field.storage.paragraph.field_venue_address.yml"];
  assert.equal(addr.type, "address");
  assert.ok(addr.dependencies.module.includes("address"));
  assert.equal(files["config/field.storage.paragraph.field_venue_hours.yml"].type, "office_hours");
});

test("emits a config variant per field-type alternative (both)", () => {
  const def = normalizeDef({
    name: "data-table",
    props: { rows: { type: "array", items: "object", drupal: { field_type: ["tablefield", "custom_field"] } } },
  });
  const ast = parseTemplate(`<table class="data-table"><tr data-for="row in rows"><td>{{ row.a }}</td></tr></table>`);
  const { files, variants } = emitDrupalConfig({ name: "data-table", def, ast });

  assert.equal(variants.length, 2);
  assert.equal(files["config/field.storage.paragraph.field_data_table_rows.yml"].type, "tablefield");
  const altKey = Object.keys(files).find((k) => k.startsWith("config-") && k.endsWith("field.storage.paragraph.field_data_table_rows.yml"));
  assert.ok(altKey, "alternative variant folder present");
  assert.equal(files[altKey].type, "custom");
});

test("generate() includes importable Drupal config", () => {
  const def = normalizeDef({ name: "x", props: { title: { type: "string" } } });
  const { files } = generate({ id: "t/x", def, template: `<div class="x">{{ title }}</div>` });
  assert.ok(files["drupal/config/paragraphs.paragraphs_type.x.yml"]);
  assert.ok(files["drupal/config/field.storage.paragraph.field_x_title.yml"]);
});

/**
 * Node-bundle ("simple site templating") config emitter.
 * -------------------------------------------------------------------------
 * Maps a component onto a plain **node bundle** (content type) with one real
 * field per prop — the truest Drupal "site template" test, without paragraphs.
 * For each component it writes, under drupal/config/:
 *
 *   node.type.<bundle>.yml
 *   field.storage.node.<field>.yml          (one per prop/slot)
 *   field.field.node.<bundle>.<field>.yml
 *   core.entity_form_display.node.<bundle>.default.yml
 *   core.entity_view_display.node.<bundle>.default.yml
 *
 * plus templates/node--<bundle>.html.twig that renders the SDC from the node's
 * field values.
 *
 * Scalar props → core field types (string/text_long/integer/boolean/list_string/
 * link/image). Array/object props → custom_field, with columns inferred from the
 * template's `item.<col>` usages. Slots → text_long (rendered into the {% block %}).
 *
 * Field machine-names are namespaced per bundle (field_<bundle>_<prop>, hash-
 * truncated to 32 chars) via the shared fieldName(), so unrelated components can't
 * collide on one field storage.
 */
import {
  FIELD_TYPES, DEFAULT_BY_TYPE, fieldName, titleCase, resolveCandidates,
  inferColumns, loopVarFor,
} from "../../packages/generator/src/emit/drupal-config.js";

const machine = (name) => String(name).replace(/-/g, "_");

/** Pick the primary field-type key for a prop (arrays/objects → custom_field). */
function fieldTypeKeyFor(prop) {
  if (prop.type === "array" || prop.type === "object") return "custom_field";
  return resolveCandidates(prop)[0];
}

/** Columns for a complex (array/object) prop, inferred from the template AST. */
function columnsFor(prop, ast) {
  const inferred = prop.type === "array" ? inferColumns(ast, loopVarFor(prop, ast)) : inferColumns(ast, prop.name);
  return Object.keys(inferred).length ? inferred : { value: "string" };
}

/** custom_field storage `columns` + field `field_settings` from inferred columns. */
function customFieldContext(cols) {
  const columns = {};
  const fieldSettings = {};
  let weight = 0;
  for (const [name, t] of Object.entries(cols)) {
    const colType = t === "text_long" ? "string_long" : "string"; // uri stored as string
    columns[name] = { name, type: colType, max_length: 255, unsigned: false, size: "normal" };
    fieldSettings[name] = {
      type: t === "text_long" ? "string_long" : t === "uri" ? "uri" : "string",
      weight: weight++, label: titleCase(name), widget_settings: { settings: {} }, formatter_settings: { settings: {} },
    };
  }
  return { columns, fieldSettings };
}

/* ------------------------------- config builders ------------------------------ */
function nodeType(bundle, name, description) {
  return {
    langcode: "en", status: true, dependencies: {}, name, type: bundle,
    description, help: "", new_revision: true, preview_mode: 1, display_submitted: false,
  };
}

function storageConfig(entry, prop, ctx) {
  const deps = new Set();
  if (entry.module !== "core") deps.add(entry.module);
  for (const m of entry.extra || []) deps.add(m);
  return {
    langcode: "en", status: true,
    dependencies: { module: ["node", ...deps].sort() },
    id: `node.${ctx.field}`, field_name: ctx.field, entity_type: "node",
    type: entry.fieldType, settings: entry.storage(prop, ctx), module: entry.module,
    locked: false, cardinality: ctx.cardinality, translatable: true, indexes: {},
    persist_with_no_fields: false, custom_storage: false,
  };
}

function fieldConfig(entry, prop, ctx) {
  const deps = new Set();
  if (entry.module !== "core") deps.add(entry.module);
  for (const m of entry.extra || []) deps.add(m);
  return {
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.node.${ctx.field}`, `node.type.${ctx.bundle}`], module: [...deps].sort() },
    id: `node.${ctx.bundle}.${ctx.field}`, field_name: ctx.field, entity_type: "node", bundle: ctx.bundle,
    label: ctx.label, description: ctx.description || "", required: Boolean(ctx.required),
    translatable: false, default_value: [], default_value_callback: "",
    settings: entry.field(prop, ctx), field_type: entry.fieldType,
  };
}

function formDisplay(bundle, items, moduleDeps, configDeps) {
  const content = {};
  let weight = 0;
  for (const it of items) {
    content[it.field] = { type: it.widget.type, weight: weight++, region: "content", settings: it.widget.settings || {}, third_party_settings: {} };
  }
  return {
    langcode: "en", status: true,
    dependencies: { config: configDeps, module: [...moduleDeps].sort() },
    id: `node.${bundle}.default`, targetEntityType: "node", bundle, mode: "default", content, hidden: {},
  };
}

function viewDisplay(bundle, items, configDeps) {
  // The node--<bundle>.html.twig renders the component directly from field values, so
  // the view display hides every field (no double render, no formatter-module deps).
  const hidden = {};
  for (const it of items) hidden[it.field] = true;
  return {
    langcode: "en", status: true,
    dependencies: { config: configDeps, module: [] },
    id: `node.${bundle}.default`, targetEntityType: "node", bundle, mode: "default", content: {}, hidden,
  };
}

/* ---------------------------------- twig ---------------------------------- */
/** node--<bundle>.html.twig that renders the SDC from node field values. */
function nodeTwig(name, def, ast, theme, fieldMap) {
  const bundle = machine(name);
  const preLines = [];   // {% set %} lines before the embed (build arrays for complex props)
  const withLines = [];
  for (const prop of def.props) {
    const fn = fieldMap[prop.name];
    if (prop.type === "boolean") { withLines.push(`  ${prop.name}: node.${fn}.value ? true : false,`); continue; }
    if (prop.type === "integer") { withLines.push(`  ${prop.name}: node.${fn}.value|default(0) + 0,`); continue; }
    if (prop.type === "link") { withLines.push(`  ${prop.name}: node.${fn}.0.url,`); continue; }
    if (prop.type === "image") { withLines.push(`  ${prop.name}: node.${fn}.entity ? file_url(node.${fn}.entity.uri.value) : '',`); continue; }
    if (prop.type === "array" || prop.type === "object") {
      const cols = Object.keys(columnsFor(prop, ast));
      const varName = `${prop.name}_val`;
      if (prop.type === "array") {
        const mapExpr = `{ ${cols.map((c) => `${c}: i.${c}`).join(", ")} }`;
        preLines.push(`{% set ${varName} = [] %}`);
        preLines.push(`{% for i in node.${fn} %}{% set ${varName} = ${varName}|merge([${mapExpr}]) %}{% endfor %}`);
        withLines.push(`  ${prop.name}: ${varName},`);
      } else {
        const mapExpr = `{ ${cols.map((c) => `${c}: node.${fn}.${c}`).join(", ")} }`;
        withLines.push(`  ${prop.name}: ${mapExpr},`);
      }
      continue;
    }
    withLines.push(`  ${prop.name}: node.${fn}.value,`);
  }

  // Slots: text_long field echoed into the matching {% block %}. The embed uses `only`,
  // so the rendered field is threaded in as a `<slot>_slot` with-var.
  const slotVars = def.slots.map((s) => `  ${s.name}_slot: node.${fieldMap[s.name]}.value|raw,`);
  const slotBlocks = def.slots.map((s) => `  {% block ${s.name} %}{{ ${s.name}_slot }}{% endblock %}`);
  const withBody = [...withLines, ...slotVars].join("\n");
  const body = slotBlocks.length ? "\n" + slotBlocks.join("\n") + "\n" : "";
  const pre = preLines.length ? preLines.join("\n") + "\n" : "";

  return `{#
  Node template for the "${name}" component (simple site-templating: one node bundle,
  one field per prop). Scalars read .value; integers cast with \`+ 0\`; links read .0.url;
  images resolve a file URL; complex props are rebuilt as an array/map of the inferred
  columns; slots pass rendered field markup into a {% block %}.
#}
${pre}{% embed '${theme}:${name}' with {
${withBody}
} only %}${body}{% endembed %}
`;
}

/* --------------------------------- entry ---------------------------------- */
/**
 * Build the node-bundle config + template map for one component.
 * @param {{name:string, def:any, ast:any[]}} input
 * @param {{theme?:string}} opts
 * @returns {Record<string,string>}  generator-rel path → YAML/twig contents (js-yaml-dumped by caller? no — objects)
 */
export function emitNodeBundle({ name, def, ast }, { theme = "your_theme" } = {}) {
  const bundle = machine(name);
  /** @type {Record<string, object|string>} */
  const files = {};
  files[`node.type.${bundle}.yml`] = nodeType(bundle, titleCase(name), `Auto-generated content type for the "${name}" component.`);

  const items = [];
  const formModules = new Set();
  const configDeps = [`node.type.${bundle}`];
  const fieldMap = {};

  const addField = (prop, { isSlot = false } = {}) => {
    const key = isSlot ? "text_long" : fieldTypeKeyFor(prop);
    const entry = FIELD_TYPES[key];
    const field = fieldName(prop.name, name);
    fieldMap[prop.name] = field;
    const ctx = {
      field, bundle, label: prop.title || titleCase(prop.name), description: prop.description, required: prop.required && !isSlot,
      cardinality: typeof entry.cardinality === "function" ? entry.cardinality(prop) : (entry.cardinality || 1),
    };
    if (key === "custom_field") {
      const { columns, fieldSettings } = customFieldContext(columnsFor(prop, ast));
      ctx.customColumns = columns; ctx.customFieldSettings = fieldSettings;
    }
    files[`field.storage.node.${field}.yml`] = storageConfig(entry, prop, ctx);
    files[`field.field.node.${bundle}.${field}.yml`] = fieldConfig(entry, prop, ctx);
    if (entry.widget.module && entry.widget.module !== "core") formModules.add(entry.widget.module);
    if (entry.module !== "core") formModules.add(entry.module);
    for (const m of entry.extra || []) formModules.add(m);
    configDeps.push(`field.field.node.${bundle}.${field}`);
    items.push({ field, widget: entry.widget });
  };

  for (const prop of def.props) addField(prop);
  for (const slot of def.slots) addField({ name: slot.name, title: slot.title, type: "text", required: false }, { isSlot: true });

  files[`core.entity_form_display.node.${bundle}.default.yml`] = formDisplay(bundle, items, formModules, [...configDeps]);
  files[`core.entity_view_display.node.${bundle}.default.yml`] = viewDisplay(bundle, items, [...configDeps]);

  return { config: files, twig: nodeTwig(name, def, ast, theme, fieldMap), fieldMap };
}

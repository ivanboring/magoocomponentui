/**
 * Nested paragraph-bundle emitter (2-level).
 * -------------------------------------------------------------------------
 * The flat custom_field model can't store a 2-level array (an array of objects that each
 * contain another array — table rows→cells, calendar days→events). This emits the outer
 * array as a CHILD paragraph bundle referenced from the parent, with the inner flat array
 * as a custom_field on the child, and a parent twig that traverses child paragraphs to
 * rebuild the full nested structure for the SDC.
 *
 *   parent bundle `<C>`:
 *     scalar props        → core fields
 *     flat array/object   → custom_field
 *     NESTED array `P`    → entity_reference_revisions → child bundle `<C>_<P>`
 *   child bundle `<C>_<P>` (one per outer item, e.g. a table row):
 *     row scalar columns  → custom_field `field_<child>_data` (cardinality 1)
 *     inner array `S`     → custom_field `field_<child>_<S>` (cardinality -1)
 *
 * All 43 nested catalog components are exactly this 2-level shape (one outer array, one
 * inner flat sub-array). Deeper nesting is not handled (none exists in the catalog).
 */
import {
  FIELD_TYPES, DEFAULT_BY_TYPE, fieldName, titleCase, resolveCandidates,
  inferColumns, loopVarFor,
} from "../../packages/generator/src/emit/drupal-config.js";

const machine = (s) => String(s).replace(/-/g, "_");

/** Find the inner loop for an outer array prop: `data-for="<inner> in <outerVar>.<sub>"`. */
export function findNested(prop, ast) {
  const outerVar = loopVarFor(prop, ast);
  let hit = null;
  const walk = (n) => {
    if (!n || n.type !== "element" || hit) return;
    const f = n.directives && n.directives.for;
    if (f && typeof f.list === "string" && f.list.startsWith(outerVar + ".")) {
      hit = { innerVar: f.item, sub: f.list.slice(outerVar.length + 1) };
    }
    n.children.forEach(walk);
  };
  ast.forEach(walk);
  if (!hit) return null;
  const scalarCols = inferColumns(ast, outerVar);   // row.<col> interpolations
  const innerCols = inferColumns(ast, hit.innerVar); // cell.<col> interpolations
  return { outerVar, ...hit, scalarCols, innerCols };
}

/** Which props of a component are nested arrays. */
export function nestedProps(def, ast) {
  const out = [];
  for (const p of def.props) {
    if (p.type !== "array") continue;
    const n = findNested(p, ast);
    if (n) out.push({ prop: p, ...n });
  }
  return out;
}

/* ------------------------------ config helpers ------------------------------ */
const dep = (entry) => {
  const s = new Set();
  if (entry.module !== "core") s.add(entry.module);
  for (const m of entry.extra || []) s.add(m);
  return [...s];
};
function customCols(cols) {
  const columns = {}, fieldSettings = {};
  let w = 0;
  const names = Object.keys(cols).length ? cols : { value: "string" };
  for (const [name, t] of Object.entries(names)) {
    const type = t === "text_long" ? "string_long" : t === "uri" ? "uri" : "string";
    columns[name] = { name, type: type === "string_long" ? "string_long" : "string", max_length: 255, unsigned: false, size: "normal" };
    fieldSettings[name] = { type, weight: w++, label: titleCase(name), widget_settings: { settings: {} }, formatter_settings: { settings: {} } };
  }
  return { columns, fieldSettings };
}

function paragraphType(bundle, label, desc) {
  return { langcode: "en", status: true, dependencies: {}, id: bundle, label, icon_uuid: null, icon_default: null, description: desc, behavior_plugins: {} };
}
function storage(entry, field, settings, card) {
  return {
    langcode: "en", status: true, dependencies: { module: ["paragraphs", ...dep(entry)].sort() },
    id: `paragraph.${field}`, field_name: field, entity_type: "paragraph", type: entry.fieldType,
    settings, module: entry.module, locked: false, cardinality: card, translatable: true, indexes: {},
    persist_with_no_fields: false, custom_storage: false,
  };
}
function fieldInst(entry, bundle, field, label, settings) {
  return {
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.paragraph.${field}`, `paragraphs.paragraphs_type.${bundle}`], module: dep(entry) },
    id: `paragraph.${bundle}.${field}`, field_name: field, entity_type: "paragraph", bundle,
    label, description: "", required: false, translatable: false, default_value: [], default_value_callback: "",
    settings, field_type: entry.fieldType,
  };
}
/**
 * Displays must declare their config dependencies (the bundle + every field they list) — the
 * config installer orders creation by those dependencies, and without them it tries to create a
 * display before the paragraph type it belongs to ("Missing bundle entity … footer_columns_columns").
 */
const displayDeps = (bundle, fields) => ({
  config: [`paragraphs.paragraphs_type.${bundle}`, ...fields.map((f) => `field.field.paragraph.${bundle}.${f}`)],
});
function formDisplay(bundle, entries) {
  const content = {};
  let w = 0;
  for (const e of entries) content[e.field] = { type: e.widget.type, weight: w++, region: "content", settings: e.widget.settings || {}, third_party_settings: {} };
  return {
    langcode: "en", status: true,
    dependencies: { ...displayDeps(bundle, entries.map((e) => e.field)), module: ["paragraphs"] },
    id: `paragraph.${bundle}.default`, targetEntityType: "paragraph", bundle, mode: "default", content, hidden: {},
  };
}
function viewDisplay(bundle, slotEntries) {
  // Only the nested-reference field is displayed (rendered via content in the parent twig
  // when needed); everything else is hidden (read off the entity in twig).
  const content = {}, hidden = {};
  let w = 0;
  for (const e of slotEntries) content[e.field] = { type: e.formatter.type, label: "hidden", settings: e.formatter.settings || {}, weight: w++, region: "content", third_party_settings: {} };
  return {
    langcode: "en", status: true,
    dependencies: displayDeps(bundle, slotEntries.map((e) => e.field)),
    id: `paragraph.${bundle}.default`, targetEntityType: "paragraph", bundle, mode: "default", content, hidden,
  };
}

/* -------------------------------- emitter -------------------------------- */
/**
 * @param {{name:string, def:any, ast:any[]}} input
 * @param {{theme?:string}} opts
 * @returns {{ config: Record<string,object>, twig: string, childBundles: string[], modules: string[] } | null}
 */
export function emitNestedParagraph({ name, def, ast }, { theme = "your_theme" } = {}) {
  const nested = nestedProps(def, ast);
  if (!nested.length) return null; // not a nested component — use the flat path

  const parent = machine(name);
  const files = {};
  const modules = new Set(["paragraphs"]);
  const childBundles = [];
  files[`paragraphs.paragraphs_type.${parent}.yml`] = paragraphType(parent, titleCase(name), `Auto-generated bundle for the "${name}" component (nested).`);

  const parentForm = [];
  const parentSlots = [];   // nested-ref fields shown in view display
  const preLines = [];      // twig {% set %} lines
  const withLines = [];
  const nestedByProp = new Map(nested.map((n) => [n.prop.name, n]));

  for (const prop of def.props) {
    const fn = fieldName(prop.name, name);
    if (nestedByProp.has(prop.name)) {
      // NESTED array → child bundle + entity_reference_revisions field on the parent.
      const n = nestedByProp.get(prop.name);
      const child = `${parent}_${machine(prop.name)}`.slice(0, 32);
      childBundles.push(child);
      const erv = FIELD_TYPES.paragraph;
      files[`field.storage.paragraph.${fn}.yml`] = storage(erv, fn, erv.storage(), -1);
      files[`field.field.paragraph.${parent}.${fn}.yml`] = fieldInst(erv, parent, fn, prop.title, { handler: "default:paragraph", handler_settings: { negate: 0, target_bundles: { [child]: child }, target_bundles_drag_drop: { [child]: { weight: 0, enabled: true } } } });
      parentForm.push({ field: fn, widget: erv.widget });
      parentSlots.push({ field: fn, formatter: erv.formatter });
      for (const m of dep(erv)) modules.add(m);

      // Child bundle: row scalars (custom_field, card 1) + inner array (custom_field, card -1).
      files[`paragraphs.paragraphs_type.${child}.yml`] = paragraphType(child, titleCase(prop.name), `Row bundle for "${name}".${prop.name}.`);
      const cf = FIELD_TYPES.custom_field;
      const childForm = [];
      // scalars
      const dataField = fieldName("data", child);
      if (Object.keys(n.scalarCols).length) {
        const { columns, fieldSettings } = customCols(n.scalarCols);
        files[`field.storage.paragraph.${dataField}.yml`] = storage(cf, dataField, { columns, field_settings: {} }, 1);
        files[`field.field.paragraph.${child}.${dataField}.yml`] = fieldInst(cf, child, dataField, "Data", { field_settings: fieldSettings });
        childForm.push({ field: dataField, widget: cf.widget });
      }
      // inner array
      const subField = fieldName(n.sub, child);
      const { columns, fieldSettings } = customCols(n.innerCols);
      files[`field.storage.paragraph.${subField}.yml`] = storage(cf, subField, { columns, field_settings: {} }, -1);
      files[`field.field.paragraph.${child}.${subField}.yml`] = fieldInst(cf, child, subField, titleCase(n.sub), { field_settings: fieldSettings });
      childForm.push({ field: subField, widget: cf.widget });
      modules.add("custom_field");
      files[`core.entity_form_display.paragraph.${child}.default.yml`] = formDisplay(child, childForm);
      files[`core.entity_view_display.paragraph.${child}.default.yml`] = viewDisplay(child, []);

      // Parent twig: traverse child paragraphs, rebuild [{ ...scalars, <sub>: [...inner] }].
      const scalarNames = Object.keys(n.scalarCols);
      const innerNames = Object.keys(n.innerCols).length ? Object.keys(n.innerCols) : ["value"];
      const v = `${prop.name}_val`;
      const sub = `${prop.name}_sub`;
      preLines.push(`{% set ${v} = [] %}`);
      preLines.push(`{% for row in paragraph.${fn} %}`);
      preLines.push(`  {% set ${sub} = [] %}`);
      preLines.push(`  {% for c in row.entity.${subField} %}{% set ${sub} = ${sub}|merge([{ ${innerNames.map((c) => `${c}: c.${c}`).join(", ")} }]) %}{% endfor %}`);
      const rowMap = [...scalarNames.map((c) => `${c}: row.entity.${dataField}.${c}`), `${n.sub}: ${sub}`].join(", ");
      preLines.push(`  {% set ${v} = ${v}|merge([{ ${rowMap} }]) %}`);
      preLines.push(`{% endfor %}`);
      withLines.push(`  ${prop.name}: ${v},`);
      continue;
    }

    // Non-nested props: same mapping as the flat paragraph path.
    if (prop.type === "boolean") { withLines.push(`  ${prop.name}: paragraph.${fn}.value ? true : false,`); addFlat(prop, fn); continue; }
    if (prop.type === "integer") { withLines.push(`  ${prop.name}: paragraph.${fn}.value|default(0) + 0,`); addFlat(prop, fn); continue; }
    if (prop.type === "link") { withLines.push(`  ${prop.name}: paragraph.${fn}.0.url|default(''),`); addFlat(prop, fn); continue; }
    if (prop.type === "image") { withLines.push(`  ${prop.name}: paragraph.${fn}.entity ? file_url(paragraph.${fn}.entity.uri.value) : '',`); addFlat(prop, fn); continue; }
    if (prop.type === "enum") { const d = prop.default != null ? prop.default : (prop.values && prop.values[0]); withLines.push(`  ${prop.name}: paragraph.${fn}.value|default('${d}'),`); addFlat(prop, fn); continue; }
    if (prop.type === "array" || prop.type === "object") {
      const cols = inferColumns(ast, prop.type === "array" ? loopVarFor(prop, ast) : prop.name);
      const names = Object.keys(cols).length ? Object.keys(cols) : ["value"];
      if (prop.type === "array") {
        const v = `${prop.name}_val`;
        preLines.push(`{% set ${v} = [] %}`);
        preLines.push(`{% for i in paragraph.${fn} %}{% set ${v} = ${v}|merge([{ ${names.map((c) => `${c}: i.${c}`).join(", ")} }]) %}{% endfor %}`);
        withLines.push(`  ${prop.name}: ${v},`);
      } else {
        withLines.push(`  ${prop.name}: { ${names.map((c) => `${c}: paragraph.${fn}.${c}`).join(", ")} },`);
      }
      addFlat(prop, fn);
      continue;
    }
    withLines.push(`  ${prop.name}: paragraph.${fn}.value,`);
    addFlat(prop, fn);
  }

  function addFlat(prop, fn) {
    const key = (prop.type === "array" || prop.type === "object") ? "custom_field" : (resolveCandidates(prop)[0] || DEFAULT_BY_TYPE[prop.type] || "string");
    const entry = FIELD_TYPES[key];
    let settings = entry.storage(prop, {});
    let fieldSettings = entry.field(prop, {});
    if (key === "custom_field") {
      const cols = inferColumns(ast, prop.type === "array" ? loopVarFor(prop, ast) : prop.name);
      const c = customCols(cols);
      settings = { columns: c.columns, field_settings: {} };
      fieldSettings = { field_settings: c.fieldSettings };
    }
    if (key === "list_string") settings = FIELD_TYPES.list_string.storage(prop);
    const card = typeof entry.cardinality === "function" ? entry.cardinality(prop) : (entry.cardinality || 1);
    files[`field.storage.paragraph.${fn}.yml`] = storage(entry, fn, settings, card);
    files[`field.field.paragraph.${parent}.${fn}.yml`] = fieldInst(entry, parent, fn, prop.title, fieldSettings);
    parentForm.push({ field: fn, widget: entry.widget });
    for (const m of dep(entry)) modules.add(m);
  }

  // Slots on a nested component (rare) → paragraph-ref fields, shown in view display.
  for (const slot of def.slots) {
    const fn = fieldName(slot.name, name);
    const erv = FIELD_TYPES.paragraph;
    files[`field.storage.paragraph.${fn}.yml`] = storage(erv, fn, erv.storage(), -1);
    files[`field.field.paragraph.${parent}.${fn}.yml`] = fieldInst(erv, parent, fn, slot.title, { handler: "default:paragraph", handler_settings: { negate: 0, target_bundles: null, target_bundles_drag_drop: {} } });
    parentForm.push({ field: fn, widget: erv.widget });
    parentSlots.push({ field: fn, formatter: erv.formatter });
    withLines.push(`  ${slot.name}_slot: content.${fn},`);
    for (const m of dep(erv)) modules.add(m);
  }

  files[`core.entity_form_display.paragraph.${parent}.default.yml`] = formDisplay(parent, parentForm);
  files[`core.entity_view_display.paragraph.${parent}.default.yml`] = viewDisplay(parent, parentSlots);

  const slotBlocks = def.slots.map((s) => `  {% block ${s.name} %}{{ ${s.name}_slot }}{% endblock %}`);
  const body = slotBlocks.length ? "\n" + slotBlocks.join("\n") + "\n" : "";
  const twig = `{#
  Nested paragraph template for "${name}". The outer array is stored as child paragraphs;
  this traverses them (row.entity.<field>) to rebuild the full nested array for the SDC.
#}
${preLines.join("\n")}
{% embed '${theme}:${name}' with {
${withLines.join("\n")}
} only %}${body}{% endembed %}
`;
  return { config: files, twig, childBundles, modules: [...modules] };
}

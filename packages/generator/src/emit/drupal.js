/**
 * Drupal emitter — maps a component onto a paragraph entity so an agent can wire
 * it to real content. Produces (into the component's drupal/ output):
 *   fields.yml                        declarative field plan (prop → Drupal field)
 *   paragraph--<name>.html.twig       renders the SDC from paragraph field values
 *   custom_field.<name>.yml           columns for complex/repeating props (when any)
 *
 * Complex props (array/object) become a custom_field; its columns are INFERRED
 * from the `item.<col>` paths the template actually uses. Output is an adaptable,
 * commented scaffold — a site-builder/agent tweaks field machine-names to taste.
 */
import yaml from "js-yaml";

/** @param {string} name */
function fieldName(name) {
  return `field_${name.replace(/-/g, "_")}`;
}

/** Collect `item.<col>` usages (and a light type guess) under a for-loop subtree. */
function inferColumns(ast, loopVar) {
  /** @type {Record<string, string>} */
  const cols = {};
  /** @param {any} node @param {string|null} attrName */
  function visitParts(parts, attrName) {
    for (const p of parts) {
      if (p.kind !== "expr" && p.kind !== "raw") continue;
      const m = new RegExp(`^${loopVar}\\.(\\w+)$`).exec(p.path);
      if (!m) continue;
      const col = m[1];
      let type = "string";
      if (p.kind === "raw") type = "text_long";
      else if (attrName === "src") type = "image";
      else if (attrName === "href") type = "uri";
      cols[col] = cols[col] || type;
    }
  }
  /** @param {any} node */
  function walk(node) {
    if (!node) return;
    if (node.type === "text") visitParts(node.parts, null);
    if (node.type === "element") {
      for (const a of node.attrs) visitParts(a.parts, a.name);
      for (const c of node.children) walk(c);
    }
    if (node.type === "slot") for (const c of node.fallback) walk(c);
  }
  /** find the element carrying the matching for-directive and walk its subtree */
  function findLoop(node) {
    if (node && node.type === "element") {
      if (node.directives && node.directives.for && node.directives.for.item === loopVar) {
        walk(node);
        return true;
      }
      for (const c of node.children) if (findLoop(c)) return true;
    }
    return false;
  }
  for (const n of ast) if (findLoop(n)) break;
  return cols;
}

/** @param {any} prop @param {any[]} ast @returns {any} */
function propToField(prop, ast) {
  const fn = fieldName(prop.name);
  const base = { field_name: fn, label: prop.title };
  switch (prop.type) {
    case "string": return { ...base, type: "string" };
    case "text": return { ...base, type: "text_long" };
    case "html": return { ...base, type: "text_long", format: "full_html" };
    case "integer": return { ...base, type: "integer" };
    case "boolean": return { ...base, type: "boolean" };
    case "enum": return { ...base, type: "list_string", allowed_values: prop.values };
    case "link": return { ...base, type: "link" };
    case "image":
      return { ...base, type: "entity_reference", target_type: "media", handler: "default:media", bundle: "image" };
    case "array":
    case "object": {
      const columns = inferColumns(ast, prop.type === "array" ? loopVarFor(prop, ast) : prop.name);
      return {
        ...base,
        type: "custom_field",
        cardinality: prop.type === "array" ? -1 : 1,
        columns: Object.keys(columns).length ? columns : { value: "string" },
      };
    }
    default: return { ...base, type: "string" };
  }
}

/** best-effort: find the loop variable bound to this array prop */
function loopVarFor(prop, ast) {
  let found = "item";
  function walk(node) {
    if (node && node.type === "element") {
      if (node.directives && node.directives.for && node.directives.for.list === prop.name) {
        found = node.directives.for.item;
        return true;
      }
      for (const c of node.children) if (walk(c)) return true;
    }
    return false;
  }
  for (const n of ast) if (walk(n)) break;
  return found;
}

/**
 * @param {{ name:string, def:any, ast:any[], metadata?:any, themeMachineName?:string }} input
 * @returns {Record<string,string>}
 */
export function emitDrupal({ name, def, ast, themeMachineName = "your_theme" }) {
  const fields = def.props.map((p) => propToField(p, ast));
  const slotFields = def.slots.map((s) => ({
    field_name: fieldName(s.name),
    label: s.title,
    type: "entity_reference_revisions",
    target_type: "paragraph",
    note: "Slot: accepts child paragraphs/components. Or use text_long for simple markup.",
  }));

  const fieldsDoc = {
    paragraph_type: name.replace(/-/g, "_"),
    label: def.props.length ? def.name : def.name,
    fields,
    slots: slotFields,
  };

  const customFields = fields.filter((f) => f.type === "custom_field");

  /** @type {Record<string,string>} */
  const files = {};
  files["fields.yml"] = yaml.dump(fieldsDoc, { lineWidth: 120, noRefs: true });
  files[`paragraph--${name}.html.twig`] = paragraphTwig(name, def, themeMachineName);
  if (customFields.length) {
    files[`custom_field.${name}.yml`] = yaml.dump(
      { note: "Column plan for complex/repeating props — create these as Custom Field columns.", fields: customFields },
      { lineWidth: 120, noRefs: true },
    );
  }
  return files;
}

/** paragraph template that renders the SDC from paragraph field values */
function paragraphTwig(name, def, theme) {
  const propLines = def.props.map((p) => {
    const fn = fieldName(p.name);
    if (p.type === "boolean") return `    ${p.name}: paragraph.${fn}.value ? true : false,`;
    if (p.type === "link") return `    ${p.name}: paragraph.${fn}.0.url,`;
    if (p.type === "image") return `    ${p.name}: paragraph.${fn}.entity.field_media_image.entity.uri.value|image_style('large'),`;
    if (p.type === "array" || p.type === "object")
      return `    ${p.name}: paragraph.${fn}, {# custom_field items — iterate item.<column> in the component #}`;
    return `    ${p.name}: paragraph.${fn}.value,`;
  });
  const slotLines = def.slots.map((s) => `    ${s.name}: content.${fieldName(s.name)},`);
  const all = [...propLines, ...slotLines].join("\n");
  return `{#
  Paragraph template for the "${name}" component.
  Adjust field machine-names to match your paragraph bundle. Scalar props read
  .value; links read .0.url; images resolve a media reference; slots pass rendered
  child content. Complex props pass the custom_field list — the component iterates
  item.<column>.
#}
{% embed '${theme}:${name}' with {
${all}
} only %}
{% endembed %}
`;
}

/**
 * Drupal emitter — maps a component onto a paragraph entity. Produces, into the
 * component's drupal/ output:
 *   fields.yml                        human-readable field plan (prop → Drupal field)
 *   paragraph--<name>.html.twig       renders the SDC from paragraph field values
 *   custom_field.<name>.yml           column plan for complex/repeating props (when any)
 *   config[/-<variant>]/*.yml         IMPORTABLE config entities (paragraph type,
 *                                     field storage/instances, form + view displays)
 *
 * A prop maps to a Drupal field type by its prop type, or via `drupal.field_type`
 * in component.def.yml (string, or an array of alternatives → one config set each).
 * See emit/drupal-config.js for the field-type registry (core + contrib).
 */
import yaml from "js-yaml";
import { emitDrupalConfig, inferColumns, loopVarFor, fieldName, resolveCandidates } from "./drupal-config.js";

/** @param {any} prop @param {any[]} ast @param {string} bundle @returns {any} */
function propToField(prop, ast, bundle) {
  const fn = fieldName(prop.name, bundle);
  const chosen = resolveCandidates(prop);
  const base = { field_name: fn, label: prop.title, field_type: chosen[0] };
  if (chosen.length > 1) base.alternatives = chosen.slice(1);
  if (prop.type === "enum") base.allowed_values = prop.values;
  if (prop.type === "array" || prop.type === "object") {
    const columns = inferColumns(ast, prop.type === "array" ? loopVarFor(prop, ast) : prop.name);
    base.columns = Object.keys(columns).length ? columns : { value: "string" };
    base.cardinality = prop.type === "array" ? -1 : 1;
  }
  return base;
}

/**
 * @param {{ name:string, def:any, ast:any[], metadata?:any, themeMachineName?:string }} input
 * @returns {Record<string,string>}
 */
export function emitDrupal({ name, def, ast, themeMachineName = "your_theme" }) {
  const fields = def.props.map((p) => propToField(p, ast, name));
  const slotFields = def.slots.map((s) => ({
    field_name: fieldName(s.name, name),
    label: s.title,
    field_type: "entity_reference_revisions",
    target_type: "paragraph",
    note: "Slot: accepts child paragraphs/components. Or use text_long for simple markup.",
  }));

  const fieldsDoc = { paragraph_type: name.replace(/-/g, "_"), label: def.name, fields, slots: slotFields };
  const customFields = fields.filter((f) => f.field_type === "custom_field");

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

  // Importable config entities (one set per field-type variant).
  const { files: configFiles, variants, capped } = emitDrupalConfig({ name, def, ast });
  for (const [file, obj] of Object.entries(configFiles)) {
    files[file] = yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false });
  }
  if (variants.length > 1 || capped) {
    files["config/README.md"] = variantsReadme(name, variants, capped);
  }
  return files;
}

/** @param {string} name @param {Array<{dir:string,choice:Record<string,string>}>} variants @param {boolean} capped */
function variantsReadme(name, variants, capped) {
  const rows = variants
    .map((v) => `- \`${v.dir}/\` — ${Object.entries(v.choice).map(([p, k]) => `${p}: **${k}**`).join(", ") || "(no fields)"}`)
    .join("\n");
  return `# Importable config for "${name}"

Each folder is a self-contained set of Drupal config entities. Import a set with:

\`\`\`
drush config:import --partial --source=dist/<id>/drupal/<folder>
\`\`\`

Enable the modules the chosen field types require first. Field-type machine names are
import-accurate; widgets/formatters/settings are sensible defaults to tune.

## Variants (field-type choices)
${rows}
${capped ? "\n> Note: variant combinations were capped; not every field-type combination is emitted." : ""}
`;
}

/** paragraph template that renders the SDC from paragraph field values */
function paragraphTwig(name, def, theme) {
  const propLines = def.props.map((p) => {
    const fn = fieldName(p.name, name);
    if (p.type === "boolean") return `    ${p.name}: paragraph.${fn}.value ? true : false,`;
    // Integer/number fields return their .value as a string; `+ 0` coerces so strict SDC
    // props typed integer/number don't reject it.
    if (p.type === "integer") return `    ${p.name}: paragraph.${fn}.value|default(0) + 0,`;
    if (p.type === "link") return `    ${p.name}: paragraph.${fn}.0.url,`;
    if (p.type === "image") return `    ${p.name}: file_url(paragraph.${fn}.entity.uri.value),`;
    // Complex props pass the field item list; the component iterates item.<column>. (An
    // explanatory {# comment #} can't live inside the active {% embed %} tag, so it's in
    // the doc block above, not on this line.)
    if (p.type === "array" || p.type === "object") return `    ${p.name}: paragraph.${fn},`;
    return `    ${p.name}: paragraph.${fn}.value,`;
  });
  // A slot is a {% block %}, not a `with` var. Because the embed uses `only`, the block
  // body can't see `content`, so the rendered child field is passed in as a `with` var
  // (…_slot) and echoed inside the matching block override.
  const slotVars = def.slots.map((s) => `    ${s.name}_slot: content.${fieldName(s.name, name)},`);
  const slotBlocks = def.slots.map((s) => `  {% block ${s.name} %}{{ ${s.name}_slot }}{% endblock %}`);
  const withLines = [...propLines, ...slotVars].join("\n");
  const body = slotBlocks.length ? "\n" + slotBlocks.join("\n") + "\n" : "";
  return `{#
  Paragraph template for the "${name}" component. Adjust field machine-names to match your
  paragraph bundle. Scalar props read .value; integers/numbers are cast with \`+ 0\`; links
  read .0.url; images resolve a file URL; complex props pass the field item list (the
  component iterates item.<column>); slots pass rendered child content into a {% block %}.
#}
{% embed '${theme}:${name}' with {
${withLines}
} only %}${body}{% endembed %}
`;
}

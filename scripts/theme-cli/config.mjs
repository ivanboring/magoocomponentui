import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../../packages/generator/src/def.js";
import { generate } from "../../packages/generator/src/index.js";
import { readComponentSource, COMPONENTS_DIR } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";
import { customFieldConfigFiles } from "./config-custom-field.mjs";
import { emitNodeBundle } from "./config-node-bundle.mjs";
import { emitNestedParagraph, nestedProps } from "./config-nested-para.mjs";

/** The Drupal paragraph config subset of a generate() output. */
export function paragraphConfigFiles(files) {
  return Object.fromEntries(Object.entries(files).filter(([k]) =>
    k.startsWith("drupal/config/") ||
    ((k.startsWith("drupal/paragraph--") || k.startsWith("drupal/field--")) && k.endsWith(".html.twig"))));
}

/** The normalized def (props/slots) of one catalog component. @param {string} id */
export async function loadComponentDef(id) {
  const src = await readComponentSource(path.join(COMPONENTS_DIR, id));
  return loadDef(src.defYaml);
}

/** Generate the config file map for one component. @param {string} id @param {{as,entity?,bundle?,theme?}} opts */
export async function configFilesFor(id, { as, entity, bundle, theme }) {
  const dir = path.join(COMPONENTS_DIR, id);
  const src = await readComponentSource(dir);
  const def = loadDef(src.defYaml);
  const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
  if (as === "custom-field") return customFieldConfigFiles(def, { entity, bundle });
  const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null, themeMachineName: theme });
  if (as === "node") {
    // Simple site-templating: a node bundle with one field per prop + node--<name>.html.twig.
    const ast = JSON.parse(files["ast.json"]);
    const { config, twig } = emitNodeBundle({ name: def.name, def, ast }, { theme: theme || "your_theme" });
    const out = {};
    for (const [rel, obj] of Object.entries(config)) {
      out[`drupal/config/${rel}`] = yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false });
    }
    out[`drupal/node--${def.name}.html.twig`] = twig;
    return out;
  }
  // A component whose template loops an array *inside* another array (footer-columns'
  // columns[].links[], table rows[].cells[]) cannot be expressed by the flat custom_field
  // model — the inner list would be dropped. Emit it as parent + child paragraph bundles.
  const ast = JSON.parse(files["ast.json"]);
  if (nestedProps(def, ast).length) {
    const { config, twig } = emitNestedParagraph({ name: def.name, def, ast }, { theme: theme || "your_theme" });
    const out = {};
    for (const [rel, obj] of Object.entries(config)) {
      out[`drupal/config/${rel}`] = yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false });
    }
    out[`drupal/paragraph--${def.name}.html.twig`] = twig;
    // Slot field templates (wrapperless child render) still come from the flat emitter.
    for (const [rel, contents] of Object.entries(paragraphConfigFiles(files))) {
      if (rel.startsWith("drupal/field--")) out[rel] = contents;
    }
    return out;
  }
  return paragraphConfigFiles(files);
}

export async function runConfig(argv) {
  const f = parseFlags(argv);
  const ids = f._;
  const as = f.as || "paragraph";
  const out = f.out || "./out";
  if (!ids.length) throw new Error("config: pass one or more component ids");
  if (as === "custom-field" && (!f.entity || !f.bundle)) throw new Error("config --as custom-field requires --entity and --bundle");

  for (const id of ids) {
    for (const [rel, contents] of Object.entries(await configFilesFor(id, { as, entity: f.entity, bundle: f.bundle, theme: f.theme }))) {
      const dest = path.join(out, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
  }
  process.stderr.write(`Wrote config for ${ids.length} component(s) → ${out} (as: ${as})\n`);
}

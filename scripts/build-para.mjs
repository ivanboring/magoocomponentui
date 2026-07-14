/**
 * Build components into the vanilla theme as PARAGRAPH bundles (the paragraph path).
 * Usage: node scripts/build-para.mjs <id> [<id> ...]
 *
 * Writes the SDC into <theme>/components/, the paragraph config (primary variant only)
 * into <theme>/config/install/, and paragraph--<name>.html.twig into <theme>/templates/.
 * Prints the union of contrib module deps + a JSON manifest.
 *
 * A generic host content type ("para_host") with an unrestricted paragraph-reference field
 * is emitted once (scripts/para-host.mjs) so any paragraph bundle can be placed on a node.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadDef } from "../packages/generator/src/def.js";
import { generate } from "../packages/generator/src/index.js";
import { readComponentSource, COMPONENTS_DIR } from "./lib/components.mjs";
import { filesForTarget } from "./theme-cli/build.mjs";
import { paragraphConfigFiles } from "./theme-cli/config.mjs";
import { emitNestedParagraph, nestedProps } from "./theme-cli/config-nested-para.mjs";

const THEME = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drupal-base/web/themes/custom/vanilla");
const MACHINE = "vanilla";

/** Remap a generator drupal/ path into the theme layout. */
function themeDest(rel) {
  if (rel.startsWith("drupal/config/")) return path.join(THEME, "config/install", rel.slice("drupal/config/".length));
  if (/^drupal\/(paragraph|field)--.*\.html\.twig$/.test(rel)) return path.join(THEME, "templates", rel.slice("drupal/".length));
  return null;
}

async function buildOne(id) {
  const dir = path.join(COMPONENTS_DIR, id);
  const src = await readComponentSource(dir);
  const def = loadDef(src.defYaml);
  const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
  const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null, themeMachineName: MACHINE });

  // SDC → theme/components/
  for (const [rel, contents] of Object.entries(filesForTarget(files, "sdc"))) {
    const dest = path.join(THEME, "components", rel.slice("sdc/".length));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }

  const modules = new Set();
  const bundle = def.name.replace(/-/g, "_");
  const ast = JSON.parse(files["ast.json"]);

  // Nested components (a 2-level array) use the nested emitter (parent + child bundles);
  // everything else uses the flat paragraph config.
  if (nestedProps(def, ast).length) {
    const { config, twig, childBundles, modules: mods } = emitNestedParagraph({ name: def.name, def, ast }, { theme: MACHINE });
    for (const [rel, obj] of Object.entries(config)) {
      const dest = path.join(THEME, "config/install", rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false }));
    }
    const tpl = path.join(THEME, "templates", `paragraph--${def.name}.html.twig`);
    await mkdir(path.dirname(tpl), { recursive: true });
    await writeFile(tpl, twig);
    mods.forEach((m) => modules.add(m));
    return { id, bundle, childBundles, nested: true, modules: [...modules] };
  }

  // Flat paragraph config (primary variant) + twig
  for (const [rel, contents] of Object.entries(paragraphConfigFiles(files))) {
    const dest = themeDest(rel);
    if (!dest) continue;
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
    if (rel.endsWith(".yml")) {
      try { for (const m of (yaml.load(contents)?.dependencies?.module) || []) modules.add(m); } catch {}
    }
  }
  return { id, bundle, modules: [...modules] };
}

const ids = process.argv.slice(2);
if (!ids.length) { process.stderr.write("pass component ids\n"); process.exit(1); }
const built = [];
const allModules = new Set();
for (const id of ids) {
  try { const r = await buildOne(id); r.modules.forEach((m) => allModules.add(m)); built.push(r); }
  catch (e) { built.push({ id, error: String(e.message || e) }); process.stderr.write(`FAIL ${id}: ${e.message}\n`); }
}
process.stderr.write(`\nBuilt ${built.filter((b) => !b.error).length}/${ids.length}. Modules: ${[...allModules].sort().join(", ") || "(core)"}\n`);
console.log(JSON.stringify(built, null, 2));

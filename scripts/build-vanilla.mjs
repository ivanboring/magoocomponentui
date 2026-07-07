/**
 * Build components into the vanilla test theme as node bundles (simple site-templating).
 * Usage: node scripts/build-vanilla.mjs <id> [<id> ...]
 *
 * For each id: writes the SDC into <theme>/components/, the node-bundle config into
 * <theme>/config/install/, and node--<bundle>.html.twig into <theme>/templates/.
 * Prints the union of contrib module deps and a JSON manifest of what was built.
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadDef } from "../packages/generator/src/def.js";
import { generate } from "../packages/generator/src/index.js";
import { readComponentSource, COMPONENTS_DIR } from "./lib/components.mjs";
import { filesForTarget } from "./theme-cli/build.mjs";
import { emitNodeBundle } from "./theme-cli/config-node-bundle.mjs";

const THEME = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drupal-base/web/themes/custom/vanilla");
const MACHINE = "vanilla";

async function buildOne(id) {
  const dir = path.join(COMPONENTS_DIR, id);
  const src = await readComponentSource(dir);
  const def = loadDef(src.defYaml);
  const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
  const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null });
  const ast = JSON.parse(files["ast.json"]);

  // SDC → theme/components/<name>/
  for (const [rel, contents] of Object.entries(filesForTarget(files, "sdc"))) {
    const dest = path.join(THEME, "components", rel.slice("sdc/".length));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }

  // Node-bundle config + template
  const { config, twig } = emitNodeBundle({ name: def.name, def, ast }, { theme: MACHINE });
  const modules = new Set();
  for (const [rel, obj] of Object.entries(config)) {
    const dest = path.join(THEME, "config/install", rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false }));
    for (const m of (obj.dependencies && obj.dependencies.module) || []) modules.add(m);
  }
  const tplDest = path.join(THEME, "templates", `node--${def.name}.html.twig`);
  await mkdir(path.dirname(tplDest), { recursive: true });
  await writeFile(tplDest, twig);

  return { id, bundle: def.name.replace(/-/g, "_"), modules: [...modules] };
}

const ids = process.argv.slice(2);
if (!ids.length) { process.stderr.write("pass component ids\n"); process.exit(1); }
const built = [];
const allModules = new Set();
for (const id of ids) {
  try {
    const r = await buildOne(id);
    r.modules.forEach((m) => allModules.add(m));
    built.push(r);
  } catch (e) {
    built.push({ id, error: String(e.message || e) });
    process.stderr.write(`FAIL ${id}: ${e.message}\n`);
  }
}
process.stderr.write(`\nBuilt ${built.filter((b) => !b.error).length}/${ids.length}. Modules needed: ${[...allModules].sort().join(", ") || "(core only)"}\n`);
console.log(JSON.stringify(built, null, 2));

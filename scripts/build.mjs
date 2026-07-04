#!/usr/bin/env node
/**
 * Generate every target variant for every component source into dist/<id>/.
 * Component source folders stay clean; dist/ is the consumable mirror.
 */
import { mkdir, writeFile, rm, readdir, readFile, cp, stat } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../packages/generator/src/def.js";
import { generate } from "../packages/generator/src/index.js";
import { findComponentDirs, readComponentSource, DIST_DIR } from "./lib/components.mjs";

/** @param {string} p */
async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

/** Read examples/*.json into a { StoryName: args } map. */
async function readExamples(dir) {
  const exDir = path.join(dir, "examples");
  if (!(await exists(exDir))) return null;
  const files = (await readdir(exDir)).filter((f) => f.endsWith(".json"));
  if (!files.length) return null;
  /** @type {Record<string, any>} */
  const out = {};
  for (const f of files) {
    const name = path.basename(f, ".json").replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
    out[name] = JSON.parse(await readFile(path.join(exDir, f), "utf8"));
  }
  return out;
}

async function main() {
  const dirs = await findComponentDirs();
  // Clear previously generated component dirs but keep catalog.json.
  if (await exists(DIST_DIR)) {
    for (const e of await readdir(DIST_DIR, { withFileTypes: true })) {
      if (e.isDirectory()) await rm(path.join(DIST_DIR, e.name), { recursive: true, force: true });
    }
  }

  let count = 0;
  for (const { id, dir } of dirs) {
    const { defYaml, metadataYaml, template, behavior } = await readComponentSource(dir);
    const def = loadDef(defYaml);
    const metadata = metadataYaml ? yaml.load(metadataYaml) : {};
    const examples = await readExamples(dir);

    const { files } = generate({ id, name: def.name, def, template, behavior, metadata, examples });
    const outDir = path.join(DIST_DIR, id);
    for (const [rel, contents] of Object.entries(files)) {
      const dest = path.join(outDir, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
    // Preferred args for preview/screenshots: the "Default" example, else the first.
    if (examples) {
      const preferred = examples.Default || Object.values(examples)[0];
      await writeFile(path.join(outDir, "preview.json"), JSON.stringify(preferred, null, 2));
    }
    // Mirror screenshots alongside the generated variants for the preview.
    const shots = path.join(dir, "screenshots");
    if (await exists(shots)) await cp(shots, path.join(outDir, "screenshots"), { recursive: true });
    count++;
  }

  console.log(`Generated ${count} component(s) → dist/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Build dist/catalog.json from all component sources.
 * Validates each metadata.yml against the schema; fails (exit 1) on any error.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadDef } from "../packages/generator/src/def.js";
import { validateMetadataYaml } from "../packages/schema/src/validate.js";
import { buildEntry, assembleCatalog } from "../packages/schema/src/catalog.js";
import { findComponentDirs, readComponentSource, DIST_DIR } from "./lib/components.mjs";

async function main() {
  const dirs = await findComponentDirs();
  const entries = [];
  const problems = [];

  for (const { id, dir } of dirs) {
    const { defYaml, metadataYaml } = await readComponentSource(dir);
    let def;
    try {
      def = loadDef(defYaml);
    } catch (err) {
      problems.push(`[${id}] component.def.yml: ${err.message}`);
      continue;
    }
    if (!metadataYaml) {
      problems.push(`[${id}] missing metadata.yml`);
      continue;
    }
    const { valid, errors, data } = validateMetadataYaml(metadataYaml);
    if (!valid) {
      for (const e of errors) problems.push(`[${id}] metadata.yml: ${e}`);
      continue;
    }
    entries.push(buildEntry({ id, path: path.relative(DIST_DIR, dir), def, metadata: data }));
  }

  const catalog = assembleCatalog(entries, { generatedAt: new Date().toISOString() });
  await mkdir(DIST_DIR, { recursive: true });
  await writeFile(path.join(DIST_DIR, "catalog.json"), JSON.stringify(catalog, null, 2));

  console.log(`Catalog: ${entries.length}/${dirs.length} components → dist/catalog.json`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

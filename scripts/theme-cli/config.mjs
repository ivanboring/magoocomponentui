import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../../packages/generator/src/def.js";
import { generate } from "../../packages/generator/src/index.js";
import { readComponentSource } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";
import { customFieldConfigFiles } from "./config-custom-field.mjs";

/** The Drupal paragraph config subset of a generate() output. */
export function paragraphConfigFiles(files) {
  return Object.fromEntries(Object.entries(files).filter(([k]) =>
    k.startsWith("drupal/config/") || (k.startsWith("drupal/paragraph--") && k.endsWith(".html.twig"))));
}

export async function runConfig(argv) {
  const f = parseFlags(argv);
  const ids = f._;
  const as = f.as || "paragraph";
  const out = f.out || "./out";
  if (!ids.length) throw new Error("config: pass one or more component ids");
  if (as === "custom-field" && (!f.entity || !f.bundle)) throw new Error("config --as custom-field requires --entity and --bundle");

  for (const id of ids) {
    const dir = path.join("components", id);
    const src = await readComponentSource(dir);
    const def = loadDef(src.defYaml);
    const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
    const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null });

    const emit = as === "custom-field"
      ? customFieldConfigFiles(def, { entity: f.entity, bundle: f.bundle })
      : paragraphConfigFiles(files);
    for (const [rel, contents] of Object.entries(emit)) {
      const dest = path.join(out, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
  }
  process.stderr.write(`Wrote config for ${ids.length} component(s) → ${out} (as: ${as})\n`);
}

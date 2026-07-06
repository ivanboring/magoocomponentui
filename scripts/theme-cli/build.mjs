import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../../packages/generator/src/def.js";
import { generate, renderToHtml } from "../../packages/generator/src/index.js";
import { readComponentSource } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";

const PREFIX = { sdc: "sdc/", "code-component": "code-component/", react: "react/", vue: "vue/" };

/** Select the generated files for a target (path-prefix match). `html` is handled in runBuild. */
export function filesForTarget(files, target) {
  if (target === "html") return files;
  const prefix = PREFIX[target];
  if (!prefix) throw new Error(`unknown target: ${target}`);
  return Object.fromEntries(Object.entries(files).filter(([k]) => k.startsWith(prefix)));
}

async function defaultExample(dir) {
  try { return JSON.parse(await readFile(path.join(dir, "examples/default.json"), "utf8")); } catch { return {}; }
}

export async function runBuild(argv) {
  const f = parseFlags(argv);
  const ids = f._;
  const target = f.target || "sdc";
  const out = f.out || "./out";
  if (!ids.length) throw new Error("build: pass one or more component ids");

  for (const id of ids) {
    const dir = path.join("components", id);
    const src = await readComponentSource(dir);
    const def = loadDef(src.defYaml);
    const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
    const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null });

    if (target === "html") {
      const ast = JSON.parse(files["ast.json"]);
      const meta = JSON.parse(files["meta.json"]);
      const html = renderToHtml(ast, { ...(await defaultExample(dir)), $variants: meta.def.variants });
      const dest = path.join(out, `${def.name}.html`);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, html);
      continue;
    }
    for (const [rel, contents] of Object.entries(filesForTarget(files, target))) {
      const dest = path.join(out, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
  }
  process.stderr.write(`Built ${ids.length} component(s) → ${out} (target: ${target})\n`);
}

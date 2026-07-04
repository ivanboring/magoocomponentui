import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defaultArgs } from "@magoo/generator";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = path.join(ROOT, "dist");

const EMPTY = { count: 0, components: [], facets: { categories: {}, atomic_types: [], usage_types: [] } };

export function loadCatalog() {
  const p = path.join(DIST, "catalog.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : EMPTY;
}

/** Load render inputs for one component id (e.g. "notifications/alert"). */
export function loadRender(id) {
  const dir = path.join(DIST, id);
  const ast = JSON.parse(readFileSync(path.join(dir, "ast.json"), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const args = { ...defaultArgs(meta.def), $variants: meta.def.variants };
  // A component's portable behavior (self-inits in the browser), if it has one.
  const jsPath = path.join(dir, "sdc", meta.name, `${meta.name}.js`);
  const behaviorJs = existsSync(jsPath) ? readFileSync(jsPath, "utf8") : null;
  return { ast, meta, args, behaviorJs };
}

export const THEMES = [
  { id: "simple", label: "Simple" },
  { id: "futuristic", label: "Futuristic" },
  { id: "classic", label: "Classic" },
  { id: "smooth", label: "Smooth" },
];

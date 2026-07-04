/**
 * Shared component-source discovery used by build + catalog + screenshot scripts.
 * A component source folder is any directory containing `component.def.yml`.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const COMPONENTS_DIR = path.join(ROOT, "components");
export const DIST_DIR = path.join(ROOT, "dist");

/** @param {string} p */
async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively find component source directories under `components/`.
 * @returns {Promise<Array<{ id: string, dir: string }>>}  id is category/name relative to components/
 */
export async function findComponentDirs() {
  if (!(await exists(COMPONENTS_DIR))) return [];
  /** @type {Array<{id:string, dir:string}>} */
  const found = [];
  /** @param {string} dir */
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name === "component.def.yml")) {
      found.push({ id: path.relative(COMPONENTS_DIR, dir).split(path.sep).join("/"), dir });
      return; // a component folder is a leaf; don't descend further
    }
    for (const e of entries) {
      if (e.isDirectory()) await walk(path.join(dir, e.name));
    }
  }
  await walk(COMPONENTS_DIR);
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

/** @param {string} dir */
export async function readComponentSource(dir) {
  const defYaml = await readFile(path.join(dir, "component.def.yml"), "utf8");
  const metaPath = path.join(dir, "metadata.yml");
  const metadataYaml = (await exists(metaPath)) ? await readFile(metaPath, "utf8") : null;
  const templatePath = path.join(dir, "template.html");
  const template = (await exists(templatePath)) ? await readFile(templatePath, "utf8") : "";
  const behaviorPath = path.join(dir, "behavior.js");
  const behavior = (await exists(behaviorPath)) ? await readFile(behaviorPath, "utf8") : null;
  return { defYaml, metadataYaml, template, behavior };
}

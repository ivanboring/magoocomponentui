import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { findComponentDirs } from "../lib/components.mjs";

/** Load every component's metadata: [{ id, dir, metadata }]. */
export async function loadAllMetadata() {
  const dirs = await findComponentDirs();
  const out = [];
  for (const { id, dir } of dirs) {
    try {
      const raw = await readFile(path.join(dir, "metadata.yml"), "utf8");
      out.push({ id, dir, metadata: yaml.load(raw) || {} });
    } catch { /* skip components without metadata */ }
  }
  return out;
}

/**
 * @param {Array<{id:string, metadata:any}>} all
 * @param {{q?:string, category?:string, subcategory?:string, usage?:string, atomic?:string, lifecycle?:string}} f
 */
export function searchComponents(all, f = {}) {
  const q = (f.q || "").trim().toLowerCase();
  // Catalog values are capitalized ("Commerce"); callers type them however they like.
  const eq = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
  return all
    .filter(({ metadata: m }) => {
      const c = m.categorization || {};
      if (f.category && !eq(c.category, f.category)) return false;
      if (f.subcategory && !eq(c.subcategory, f.subcategory)) return false;
      if (f.atomic && !eq(c.atomic_type, f.atomic)) return false;
      if (f.lifecycle && !eq(m.lifecycle, f.lifecycle)) return false;
      if (f.usage && !(c.usage_type || []).some((u) => eq(u, f.usage))) return false;
      if (q) {
        const hay = [m.name, m.short_description, (m.use_cases || []).join(" "), (m.example_prompts || []).join(" ")]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map(({ id, metadata: m }) => ({ id, display_name: m.name || id, short_description: m.short_description || "" }));
}

/** Minimal `--key value` / `--flag` parser used by all subcommands. */
export function parseFlags(argv) {
  const f = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) f[key] = true;
      else { f[key] = next; i++; }
    } else rest.push(a);
  }
  f._ = rest;
  return f;
}

export async function runSearch(argv) {
  const f = parseFlags(argv);
  const all = await loadAllMetadata();
  const results = searchComponents(all, f);
  if (f.json) { process.stdout.write(JSON.stringify(results, null, 2) + "\n"); return; }
  for (const r of results) process.stdout.write(`${r.id} — ${r.display_name} — ${r.short_description}\n`);
  process.stderr.write(`\n${results.length} match(es)\n`);
}

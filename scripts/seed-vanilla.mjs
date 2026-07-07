/**
 * Emit a PHP script (for `ddev drush scr`) that creates one node per built component,
 * populated from the component's examples/default.json. Run:
 *   node scripts/seed-vanilla.mjs <id> [<id> ...] > /tmp/seed.php
 *   ddev drush scr /tmp/seed.php
 *
 * Handles scalars, booleans, enums, integers, links, and custom_field array/object
 * props. Image props are skipped (no managed file in a headless render test). Slots
 * become text_long field values.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../packages/generator/src/def.js";
import { generate } from "../packages/generator/src/index.js";
import { readComponentSource, COMPONENTS_DIR } from "./lib/components.mjs";
import { fieldName, inferColumns, loopVarFor } from "../packages/generator/src/emit/drupal-config.js";

/** Coerce an example href into a Drupal link-field URI (needs a scheme). '' → skip. */
function normalizeUri(u) {
  u = String(u || "").trim();
  if (!u || u === "#" || u.startsWith("#")) return ""; // fragment-only placeholder — skip
  if (/^(https?|mailto|tel):/.test(u)) return u;
  if (u.startsWith("/")) return "internal:" + u;
  return "internal:/" + u;
}

const php = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  if (Array.isArray(v)) return "[" + v.map(php).join(", ") + "]";
  return "[" + Object.entries(v).map(([k, val]) => `${php(k)} => ${php(val)}`).join(", ") + "]";
};

async function seedOne(id) {
  const dir = path.join(COMPONENTS_DIR, id);
  const src = await readComponentSource(dir);
  const def = loadDef(src.defYaml);
  const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata: {}, examples: null });
  const ast = JSON.parse(files["ast.json"]);
  let example = {};
  try { example = JSON.parse(await readFile(path.join(dir, "examples/default.json"), "utf8")); } catch {}

  const bundle = def.name.replace(/-/g, "_");
  const values = { type: bundle, title: `${def.name} demo` };

  for (const prop of def.props) {
    if (prop.type === "image") continue; // skip (no managed file)
    const fn = fieldName(prop.name, def.name);
    const val = example[prop.name];
    if (val === undefined) continue;
    if (prop.type === "boolean") { values[fn] = Boolean(val); continue; }
    if (prop.type === "integer") { values[fn] = Number(val) || 0; continue; }
    if (prop.type === "text" || prop.type === "html") { values[fn] = { value: String(val), format: "basic_html" }; continue; }
    if (prop.type === "link") {
      const rawUri = typeof val === "object" ? (val.url || val.uri || val.href || "") : String(val);
      const uri = normalizeUri(rawUri);
      if (uri) values[fn] = { uri, title: (typeof val === "object" && val.title) || "" };
      continue;
    }
    if (prop.type === "array") {
      const cols = Object.keys(inferColumns(ast, loopVarFor(prop, ast)));
      const list = Array.isArray(val) ? val : [];
      values[fn] = list.map((item) => Object.fromEntries(cols.map((c) => [c, item && item[c] != null ? String(item[c]) : ""])));
      continue;
    }
    if (prop.type === "object") {
      const cols = Object.keys(inferColumns(ast, prop.name));
      values[fn] = [Object.fromEntries(cols.map((c) => [c, val && val[c] != null ? String(val[c]) : ""]))];
      continue;
    }
    values[fn] = String(val); // string, enum
  }

  // Slots → text_long
  const slots = example.$slots || {};
  for (const slot of def.slots) {
    if (slots[slot.name] == null) continue;
    const fn = fieldName(slot.name, def.name);
    values[fn] = { value: String(slots[slot.name]), format: "basic_html" };
  }

  return `// ${id}\n$n = \\Drupal\\node\\Entity\\Node::create(${php(values)});\n$n->save();\necho "${bundle}: /node/" . $n->id() . "\\n";\n`;
}

const ids = process.argv.slice(2);
const parts = [];
for (const id of ids) {
  try { parts.push(await seedOne(id)); }
  catch (e) { process.stderr.write(`SEED FAIL ${id}: ${e.message}\n`); }
}
console.log("<?php\n" + parts.join("\n"));

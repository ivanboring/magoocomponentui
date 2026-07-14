/**
 * Emit a PHP script (for `ddev drush scr`) that, per built component, creates a Paragraph
 * of its bundle from examples/default.json and a para_host node referencing it — so
 * /node/<nid> renders the component through the paragraph path.
 *
 * Props map to field_<bundle>_<prop> (same namespacing as the node path). Images are
 * skipped (no managed file); links normalized to internal:. Slots are paragraph-reference
 * fields (nested paragraphs) — skipped here (flat sweep); handled in the nested phase.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../packages/generator/src/def.js";
import { generate } from "../packages/generator/src/index.js";
import { readComponentSource, COMPONENTS_DIR } from "./lib/components.mjs";
import { fieldName, inferColumns, loopVarFor } from "../packages/generator/src/emit/drupal-config.js";
import { nestedProps } from "./theme-cli/config-nested-para.mjs";

const machine = (s) => String(s).replace(/-/g, "_");
/** Coerce an example value to a custom_field string column (booleans → "1"/""). */
const colVal = (v) => (v === true ? "1" : v === false || v == null ? "" : String(v));

function normalizeUri(u) {
  u = String(u || "").trim();
  if (!u || u.startsWith("#")) return "";
  if (/^(https?|mailto|tel):/.test(u)) return u;
  return u.startsWith("/") ? "internal:" + u : "internal:/" + u;
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
  const nested = nestedProps(def, ast);
  const nestedNames = new Set(nested.map((n) => n.prop.name));

  // Nested components: build child paragraphs for the outer array, then the parent.
  if (nested.length) return seedNested(def, ast, example, bundle, nested, nestedNames);

  const values = { type: bundle };
  for (const prop of def.props) {
    if (prop.type === "image") continue;
    const fn = fieldName(prop.name, def.name);
    const val = example[prop.name];
    if (val === undefined) continue;
    if (prop.type === "boolean") { values[fn] = Boolean(val); continue; }
    if (prop.type === "integer") { values[fn] = Number(val) || 0; continue; }
    if (prop.type === "text" || prop.type === "html") { values[fn] = { value: String(val), format: "basic_html" }; continue; }
    if (prop.type === "link") { const uri = normalizeUri(typeof val === "object" ? (val.url || val.uri || val.href) : val); if (uri) values[fn] = { uri, title: (val && val.title) || "" }; continue; }
    if (prop.type === "array") {
      const cols = Object.keys(inferColumns(ast, loopVarFor(prop, ast)));
      values[fn] = (Array.isArray(val) ? val : []).map((it) => Object.fromEntries(cols.map((c) => [c, it && it[c] != null ? String(it[c]) : ""])));
      continue;
    }
    if (prop.type === "object") {
      const cols = Object.keys(inferColumns(ast, prop.name));
      values[fn] = [Object.fromEntries(cols.map((c) => [c, val && val[c] != null ? String(val[c]) : ""]))];
      continue;
    }
    values[fn] = String(val);
  }

  return `// ${id}\n$p = \\Drupal\\paragraphs\\Entity\\Paragraph::create(${php(values)});\n$p->save();\n` +
    `$n = \\Drupal\\node\\Entity\\Node::create(['type'=>'para_host','title'=>${php(def.name + " (para)")},'field_para_components'=>[$p]]);\n$n->save();\n` +
    `echo "${bundle}: /node/" . $n->id() . "\\n";\n`;
}

/** Map a non-nested prop's example value to a Drupal field value (for php()). */
function flatValue(prop, val, ast, name) {
  if (prop.type === "boolean") return Boolean(val);
  if (prop.type === "integer") return Number(val) || 0;
  if (prop.type === "text" || prop.type === "html") return { value: String(val), format: "basic_html" };
  if (prop.type === "link") { const u = normalizeUri(typeof val === "object" ? (val.url || val.uri || val.href) : val); return u ? { uri: u, title: (val && val.title) || "" } : undefined; }
  if (prop.type === "array") {
    const cols = Object.keys(inferColumns(ast, loopVarFor(prop, ast)));
    return (Array.isArray(val) ? val : []).map((it) => Object.fromEntries((cols.length ? cols : ["value"]).map((c) => [c, colVal(it && it[c])])));
  }
  if (prop.type === "object") {
    const cols = Object.keys(inferColumns(ast, prop.name));
    return [Object.fromEntries((cols.length ? cols : ["value"]).map((c) => [c, colVal(val && val[c])]))];
  }
  return String(val);
}

/** Seed a nested (2-level) component: child paragraphs for the outer array + the parent. */
function seedNested(def, ast, example, bundle, nested, nestedNames) {
  const lines = [];
  const childRefs = {};
  nested.forEach((n) => {
    const P = n.prop.name;
    const child = `${bundle}_${machine(P)}`.slice(0, 32);
    const dataField = fieldName("data", child);
    const subField = fieldName(n.sub, child);
    const scalarNames = Object.keys(n.scalarCols);
    const innerNames = Object.keys(n.innerCols).length ? Object.keys(n.innerCols) : ["value"];
    const rows = Array.isArray(example[P]) ? example[P] : [];
    const vars = [];
    rows.forEach((row, ri) => {
      const v = `$${child}_${ri}`;
      const cv = { type: child };
      if (scalarNames.length) cv[dataField] = [Object.fromEntries(scalarNames.map((c) => [c, colVal(row[c])]))];
      const subArr = Array.isArray(row[n.sub]) ? row[n.sub] : [];
      cv[subField] = subArr.map((it) => Object.fromEntries(innerNames.map((c) => [c, colVal(it[c])])));
      lines.push(`${v} = \\Drupal\\paragraphs\\Entity\\Paragraph::create(${php(cv)}); ${v}->save();`);
      vars.push(v);
    });
    childRefs[fieldName(P, def.name)] = vars;
  });

  // Parent create: flat props (php-encoded) + nested fields (child paragraph vars).
  const entries = [`'type' => '${bundle}'`];
  for (const prop of def.props) {
    if (nestedNames.has(prop.name) || prop.type === "image") continue;
    const val = example[prop.name];
    if (val === undefined) continue;
    const fv = flatValue(prop, val, ast, def.name);
    if (fv === undefined) continue;
    entries.push(`${php(fieldName(prop.name, def.name))} => ${php(fv)}`);
  }
  for (const [field, vars] of Object.entries(childRefs)) entries.push(`${php(field)} => [${vars.join(", ")}]`);

  lines.push(`$p = \\Drupal\\paragraphs\\Entity\\Paragraph::create([${entries.join(", ")}]); $p->save();`);
  lines.push(`$n = \\Drupal\\node\\Entity\\Node::create(['type'=>'para_host','title'=>${php(def.name + " (nested)")},'field_para_components'=>[$p]]); $n->save();`);
  lines.push(`echo "${bundle}: /node/" . $n->id() . "\\n";`);
  return `// ${def.name} (nested)\n` + lines.join("\n") + "\n";
}

const ids = process.argv.slice(2);
const parts = [];
for (const id of ids) {
  try { parts.push(await seedOne(id)); }
  catch (e) { process.stderr.write(`SEED FAIL ${id}: ${e.message}\n`); }
}
console.log("<?php\n" + parts.join("\n"));

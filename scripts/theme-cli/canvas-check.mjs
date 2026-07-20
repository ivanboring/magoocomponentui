// scripts/theme-cli/canvas-check.mjs
/** `magoo canvas-check <ids…>` — report Drupal Canvas eligibility per catalog component. */
import { canvasEligibility } from "../../packages/generator/src/canvas.js";
import { loadComponentDef } from "./config.mjs";
import { findComponentDirs } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";

/**
 * Eligibility report for a list of component ids.
 * @param {string[]} ids
 * @returns {Promise<Array<{id:string, eligible:boolean, reasons:string[], blockingProps:string[]}>>}
 */
export async function canvasCheck(ids) {
  const out = [];
  for (const id of ids) {
    const def = await loadComponentDef(id);
    out.push({ id, ...canvasEligibility(def) });
  }
  return out;
}

/** @param {string[]} argv */
export async function runCanvasCheck(argv) {
  const f = parseFlags(argv);
  // No ids → check the whole catalog (useful to size the Canvas-eligible surface).
  const ids = f._.length ? f._ : (await findComponentDirs()).map((c) => c.id);
  const rows = await canvasCheck(ids);

  if (f.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
    return;
  }
  for (const r of rows) {
    process.stdout.write(`${r.eligible ? "OK  " : "NO  "}${r.id}\n`);
    for (const reason of r.reasons) process.stdout.write(`      ${reason}\n`);
  }
  const ok = rows.filter((r) => r.eligible).length;
  process.stdout.write(`\n${ok}/${rows.length} Canvas-eligible (use config: "paragraph" for the rest).\n`);
}

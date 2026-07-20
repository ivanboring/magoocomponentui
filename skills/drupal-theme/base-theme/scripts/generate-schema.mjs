#!/usr/bin/env node
/**
 * Config-schema generator for a Magoo theme's `magoo_*` settings.
 *
 * The token manifest is the single source of truth: every design token becomes a theme setting
 * named `magoo_<key>` (colors additionally get `magoo_<key>_dark`). Drupal needs a config schema
 * for those keys or it flags them as schema-less. Run as a script it (re)writes THIS theme's
 * schema — re-run after adding a token:
 *
 *   node scripts/generate-schema.mjs
 *
 * It also exports `schemaYaml()`, which `theme-cli create-child` calls to emit the same schema for
 * a generated subtheme: one implementation of the mapping, two callers.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** checkbox -> boolean; color / text / select / textarea -> string. */
export const schemaType = (type) => (type === "checkbox" ? "boolean" : "string");

/**
 * Body of a `config/schema/<machine>.schema.yml` for a theme whose settings come from `manifest`.
 * @param {string} machine theme machine name
 * @param {string} label human theme name, used in the settings label
 * @param {{groups: Array<{label: string, tokens: Array<{key: string, type: string, label: string}>}>}} manifest
 * @returns {string}
 */
export function schemaYaml(machine, label, manifest) {
  const lines = [
    "# GENERATED FILE - do not edit by hand.",
    "# Source: tokens.manifest.json (via scripts/generate-schema.mjs).",
    "# Every design token in the manifest becomes a theme setting named magoo_<key>;",
    "# color tokens additionally get a magoo_<key>_dark counterpart.",
    "",
    `${machine}.settings:`,
    "  type: theme_settings",
    `  label: '${String(label).replace(/'/g, "''")} settings'`,
    "  mapping:",
  ];

  for (const group of manifest.groups) {
    lines.push(`    # ${group.label}`);
    for (const token of group.tokens) {
      const tokenLabel = String(token.label).replace(/'/g, "''");
      lines.push(`    magoo_${token.key}:`);
      lines.push(`      type: ${schemaType(token.type)}`);
      lines.push(`      label: '${tokenLabel}'`);
      if (token.type === "color") {
        lines.push(`    magoo_${token.key}_dark:`);
        lines.push(`      type: string`);
        lines.push(`      label: '${tokenLabel} (dark)'`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

/* Script mode: regenerate this theme's own schema from its manifest. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const manifest = JSON.parse(readFileSync(join(root, "tokens.manifest.json"), "utf8"));
  const body = schemaYaml("magoo_agentic_base_theme", "Magoo Agentic Base Theme", manifest);
  const out = join(root, "config/schema/magoo_agentic_base_theme.schema.yml");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body);
  const count = body.split("\n").filter((l) => /^ {4}magoo_/.test(l)).length;
  console.log(`Wrote ${out} (${count} settings).`);
}

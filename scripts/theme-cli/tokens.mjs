// scripts/theme-cli/tokens.mjs
/** Token manifest — the single source of truth shared by the PHP settings form and this generator. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const BASE_THEME_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../skills/drupal-theme/base-theme");
export const BASE_MACHINE = "magoo_agentic_base_theme";

/** @returns {Promise<{groups: Array<{key:string,label:string,tokens:any[]}>}>} */
export async function loadManifest() {
  return JSON.parse(await readFile(path.join(BASE_THEME_DIR, "tokens.manifest.json"), "utf8"));
}

/** Flatten the manifest to a single token array. */
export function tokenList(manifest) {
  return manifest.groups.flatMap((g) => g.tokens);
}

/** Drupal setting name for a token key. */
export const settingName = (key) => `magoo_${key}`;

/**
 * Coerce a token value to the JS type the config schema declares for it.
 * `checkbox` tokens are `type: boolean` in the schema (see generate-schema.mjs `schemaType`),
 * so they must be emitted as real YAML booleans — a string `'0'` is schema-invalid and
 * disagrees with the hand-written base theme settings, which use `false`.
 * @param {string} type manifest token type (checkbox | color | text | select | textarea)
 * @param {unknown} value
 * @returns {string|boolean}
 */
export function coerceTokenValue(type, value) {
  if (type !== "checkbox") return String(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value ?? "").trim().toLowerCase();
  return !(s === "" || s === "0" || s === "false" || s === "no" || s === "off");
}

/** Every setting at its default, including the `_dark` counterpart of each color. */
export function defaultSettings(manifest) {
  /** @type {Record<string,string|boolean>} */
  const out = {};
  for (const t of tokenList(manifest)) {
    out[settingName(t.key)] = coerceTokenValue(t.type, t.default);
    if (t.type === "color") out[settingName(t.key) + "_dark"] = String(t.dark ?? t.default);
  }
  return out;
}

/**
 * Defaults with `tokens` applied over them.
 * @param {any} manifest
 * @param {Record<string,unknown>} tokens  token key (NOT setting name) -> value; `<key>_dark` also accepted
 */
export function settingsFromTokens(manifest, tokens = {}) {
  const out = defaultSettings(manifest);
  const types = new Map(tokenList(manifest).map((t) => [t.key, t.type]));
  for (const [k, v] of Object.entries(tokens)) {
    const name = settingName(k);
    if (!(name in out)) continue;
    // A `<key>_dark` override has no token entry of its own — it is always a color string.
    const type = types.get(k);
    out[name] = type ? coerceTokenValue(type, v) : String(v);
  }
  return out;
}

/** A Drupal `<machine>.settings.yml` body. */
export function settingsYaml(machine, settings) {
  return yaml.dump(settings, { lineWidth: 200, noRefs: true, sortKeys: true, quotingType: "'", forceQuotes: false });
}

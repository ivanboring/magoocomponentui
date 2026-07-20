/**
 * component.def.yml — the machine contract (single source of truth for prop/slot types).
 * This module loads and normalizes it into ordered arrays the emitters consume.
 *
 * Source shape (authored):
 *   name: card-podcast
 *   props:
 *     title:   { type: string, required: true, title: Title, example: "…" }
 *     variant: { type: enum, values: [a, b], default: a }
 *     items:   { type: array, items: object }
 *   slots:
 *     body: { title: Body, description: "…" }
 */

import yaml from "js-yaml";

/** Prop types that map cleanly onto every target (SDC / Preact / React / Vue / Drupal fields). */
export const PROP_TYPES = new Set([
  "string",
  "html",
  "text",
  "integer",
  "boolean",
  "enum",
  "link",
  "image",
  "video",
  "array",
  "object",
]);

/** @param {string} s */
function titleCase(s) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Prop/slot names become Twig variables and `{% block %}` names, JSX identifiers, and Drupal
 * field machine-names. A hyphen (or other non-identifier char) produces invalid Twig
 * (`{% block icon-leading %}` → SyntaxError) rather than a clear error, so reject it at load.
 * @param {string} kind @param {string} name
 */
const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function assertIdentifier(kind, name) {
  if (!IDENT.test(name)) {
    throw new Error(
      `${kind} name "${name}" is not a valid identifier (letters/digits/underscore, not starting with a digit). ` +
      `Use "${name.replace(/[^a-zA-Z0-9_]/g, "_")}" — hyphens break Twig {% block %}/variable names and JSX props.`,
    );
  }
}

/**
 * @param {string} name
 * @param {any} spec
 */
function normalizeProp(name, spec) {
  if (!spec || typeof spec !== "object") {
    throw new Error(`Prop "${name}" must be an object with a type.`);
  }
  assertIdentifier("Prop", name);
  const type = spec.type;
  if (!PROP_TYPES.has(type)) {
    throw new Error(`Prop "${name}" has invalid type "${type}". Allowed: ${[...PROP_TYPES].join(", ")}.`);
  }
  /** @type {any} */
  const prop = {
    name,
    type,
    required: Boolean(spec.required),
    title: spec.title || titleCase(name),
    description: spec.description || "",
    default: spec.default,
    example: spec.example ?? (Array.isArray(spec.examples) ? spec.examples[0] : undefined),
    // Optional Drupal field mapping hint: { field_type: string|string[], formatter?: string }
    drupal: spec.drupal && typeof spec.drupal === "object" ? spec.drupal : null,
  };
  if (type === "enum") {
    prop.values = Array.isArray(spec.values) ? spec.values : [];
    if (prop.values.length === 0) {
      throw new Error(`Enum prop "${name}" requires a non-empty "values" list.`);
    }
    prop.labels = spec.labels && typeof spec.labels === "object" ? spec.labels : null;
  }
  if (type === "array") {
    prop.items = spec.items || "object";
  }
  return prop;
}

/**
 * @param {any} def  parsed component.def.yml object
 */
export function normalizeDef(def) {
  if (!def || typeof def !== "object") throw new Error("component.def.yml must be a mapping.");
  if (!def.name || typeof def.name !== "string") {
    throw new Error("component.def.yml requires a string `name`.");
  }
  const props = Object.entries(def.props || {}).map(([name, spec]) => normalizeProp(name, spec));
  const slots = Object.entries(def.slots || {}).map(([name, spec]) => {
    assertIdentifier("Slot", name);
    return {
    name,
    title: (spec && spec.title) || titleCase(name),
    description: (spec && spec.description) || "",
    };
  });
  const variants = normalizeVariants(def.variants || {}, props);
  return { name: def.name, props, slots, variants };
}

/**
 * variants: { <enumProp>: { <value>: "utility classes", … } }
 * Referenced in templates as `{{ <enumProp>@class }}`.
 * @param {any} variants
 * @param {any[]} props
 */
function normalizeVariants(variants, props) {
  /** @type {Record<string, Record<string,string>>} */
  const out = {};
  for (const [propName, map] of Object.entries(variants)) {
    const prop = props.find((p) => p.name === propName);
    if (!prop) throw new Error(`variants: references unknown prop "${propName}".`);
    if (prop.type !== "enum") throw new Error(`variants: "${propName}" must be an enum prop.`);
    if (!map || typeof map !== "object") throw new Error(`variants.${propName} must be a mapping of value → classes.`);
    for (const value of Object.keys(map)) {
      if (!prop.values.includes(value)) {
        throw new Error(`variants.${propName}: "${value}" is not one of the enum values.`);
      }
    }
    out[propName] = { ...map };
  }
  return out;
}

/** @param {string} yamlString */
export function loadDef(yamlString) {
  return normalizeDef(yaml.load(yamlString));
}

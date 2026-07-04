/**
 * SDC emitter — produces the three files of a Drupal Single Directory Component:
 *   <name>.component.yml  (JSON-Schema props/slots + cataloging metadata)
 *   <name>.twig
 *   <name>.js             (optional; portable behavior wrapper)
 *
 * Mirrors the conventions of the reference theme (../ai_base_theme).
 */
import yaml from "js-yaml";
import { astToTwig } from "./twig.js";
import { wrapPortable } from "./behavior.js";

const SDC_SCHEMA =
  "https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json";

/** @param {string} s */
function titleCase(s) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** @param {any} prop @returns {any} */
function propToSchema(prop) {
  /** @type {any} */
  let schema;
  switch (prop.type) {
    case "string":
      schema = { type: "string" };
      break;
    case "html":
      schema = { type: "string", contentMediaType: "text/html" };
      break;
    case "text":
      schema = { type: "string" };
      break;
    case "integer":
      schema = { type: "integer" };
      break;
    case "boolean":
      schema = { type: "boolean" };
      break;
    case "enum":
      schema = { type: "string", enum: prop.values };
      break;
    case "link":
      schema = { type: "string", format: "uri-reference" };
      break;
    case "image":
      schema = { $ref: "json-schema-definitions://canvas.module/image" };
      break;
    case "array":
      schema = { type: "array", items: prop.items === "object" ? { type: "object" } : { type: prop.items } };
      break;
    case "object":
      schema = { type: "object" };
      break;
    default:
      schema = { type: "string" };
  }
  schema.title = prop.title;
  if (prop.description) schema.description = prop.description;
  if (prop.type === "enum" && prop.labels) schema["meta:enum"] = prop.labels;
  if (prop.example !== undefined) schema.examples = [prop.example];
  if (prop.default !== undefined) schema.default = prop.default;
  return schema;
}

/**
 * @param {any} def  normalized component.def
 * @param {any} [metadata]  optional metadata.yml object (enriches status/group/description)
 */
export function defToComponentYml(def, metadata = {}) {
  const properties = {};
  const required = [];
  for (const prop of def.props) {
    properties[prop.name] = propToSchema(prop);
    if (prop.required) required.push(prop.name);
  }

  const cat = (metadata.categorization || {});
  /** @type {any} */
  const doc = {
    $schema: SDC_SCHEMA,
    name: titleCase(def.name),
    status: metadata.lifecycle || "experimental",
  };
  if (metadata.short_description) doc.description = metadata.short_description;
  if (cat.category) doc.group = cat.subcategory ? `${cat.category}/${cat.subcategory}` : cat.category;

  doc.props = { type: "object" };
  if (required.length) doc.props.required = required;
  doc.props.properties = properties;

  if (def.slots.length) {
    doc.slots = Object.fromEntries(
      def.slots.map((s) => [s.name, { title: s.title, description: s.description || "" }]),
    );
  }
  return yaml.dump(doc, { lineWidth: 120, noRefs: true });
}

/**
 * @param {{ name: string, def: any, ast: any[], behavior: string|null, metadata?: any }} input
 * @returns {Record<string, string>}  filename → contents (paths relative to the SDC dir)
 */
export function emitSdc({ name, def, ast, behavior, metadata }) {
  /** @type {Record<string,string>} */
  const files = {};
  const meta = metadata || {};
  const yml = behavior
    ? defToComponentYml(def, meta).replace(
        /\n$/,
        `\nlibraryOverrides:\n  js:\n    ${name}.js: {}\n`,
      )
    : defToComponentYml(def, meta);
  files[`${name}.component.yml`] = yml;
  files[`${name}.twig`] = astToTwig(ast, def.variants || {});
  if (behavior) files[`${name}.js`] = wrapPortable(name, behavior);
  return files;
}

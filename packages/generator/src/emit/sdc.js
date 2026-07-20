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

/**
 * A representative value for a prop, used as the SDC `examples[0]`.
 * Drupal Canvas REQUIRES `examples` on every required prop (it becomes the field's default value
 * in the auto-derived `canvas.component.sdc.*` entity), so we always have one for those — falling
 * back to the authored example, then the default, then a type-shaped placeholder.
 * @param {any} prop
 */
function exampleFor(prop) {
  if (prop.example !== undefined) return prop.example;
  if (prop.default !== undefined) return prop.default;
  switch (prop.type) {
    case "text": return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    case "html": return "<p>Lorem ipsum dolor sit amet.</p>";
    case "integer": return 1;
    case "boolean": return false;
    case "enum": return prop.values[0];
    case "link": return "#";
    case "image": return "https://placehold.co/600x400";
    case "video": return "https://example.com/video.mp4";
    // A required array must satisfy `minItems: 1`, so the example can't be empty.
    case "array": return prop.items === "integer" ? [1] : prop.items === "object" ? [{}] : [prop.title];
    case "object": return {};
    default: return prop.title; // string
  }
}

/** Prop names that carry a media entity (image/video). */
export function mediaPropNames(def) {
  return new Set(def.props.filter((p) => p.type === "image" || p.type === "video").map((p) => p.name));
}

/**
 * The `canvas.module/*` $ref resolves to a media OBJECT, so a required prop's `examples[0]`
 * (Canvas uses it as the field default) must be that object shape, not a bare URL string.
 * @param {"image"|"video"} type @param {string} url
 */
function canvasMediaExample(type, url) {
  const src = String(url);
  return type === "video" ? { src } : { src, alt: "", width: 1200, height: 800 };
}

/** @param {any} prop @param {{ canvas?: boolean }} [opts] @returns {any} */
function propToSchema(prop, { canvas = false } = {}) {
  /** @type {any} */
  let schema;
  switch (prop.type) {
    case "string":
      schema = { type: "string" };
      break;
    case "html":
      // `x-formatting-context: block` tells Canvas to render a CKEditor rich-text block for this
      // prop; strict SDC ignores the `x-` extension, so it is Canvas-only to keep other output stable.
      schema = { type: "string", contentMediaType: "text/html" };
      if (canvas) schema["x-formatting-context"] = "block";
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
      // For Canvas, the `$ref` resolves to a media-entity IMAGE object (a media-library picker) —
      // {src, alt, width, height}. For every other consumer (plain SDC, React/Vue/Storybook/HTML)
      // it stays a plain URL string: the Canvas `$ref` is unresolvable without the Canvas module and
      // strict SDC would throw on it.
      schema = canvas
        ? { $ref: "json-schema-definitions://canvas.module/image", type: "object" }
        : { type: "string", format: "uri-reference" };
      break;
    case "video":
      schema = canvas
        ? { $ref: "json-schema-definitions://canvas.module/video", type: "object" }
        : { type: "string", format: "uri-reference" };
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
  // Canvas hard requirement: every prop needs a title (def.js guarantees one — title-cased name
  // when unauthored).
  schema.title = prop.title;
  if (prop.description) schema.description = prop.description;
  if (prop.type === "enum" && prop.labels) schema["meta:enum"] = prop.labels;
  // Required array props must declare minItems: 1 (Canvas maps them to a multi-cardinality field).
  if (prop.type === "array" && prop.required) schema.minItems = 1;
  // Required props ALWAYS carry an example (Canvas uses examples[0] as the field default value).
  let example = prop.required ? exampleFor(prop) : prop.example;
  // Under Canvas an image/video prop is an OBJECT, so a URL-string example must become the media
  // object shape or strict validation rejects it against the `type: object` schema.
  if (canvas && (prop.type === "image" || prop.type === "video") && example !== undefined && typeof example !== "object") {
    example = canvasMediaExample(prop.type, example);
  }
  if (example !== undefined) schema.examples = [example];
  // A media object has no scalar default; only carry a `default` for non-media props under Canvas.
  if (prop.default !== undefined && !(canvas && (prop.type === "image" || prop.type === "video"))) {
    schema.default = prop.default;
  }
  return schema;
}

/**
 * @param {any} def  normalized component.def
 * @param {any} [metadata]  optional metadata.yml object (enriches status/group/description)
 * @param {{ canvas?: boolean }} [opts]  canvas:true emits media-entity $ref props (Drupal Canvas)
 */
export function defToComponentYml(def, metadata = {}, { canvas = false } = {}) {
  const properties = {};
  const required = [];
  for (const prop of def.props) {
    properties[prop.name] = propToSchema(prop, { canvas });
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
  // `group` becomes the folder the component lands in inside the Drupal Canvas Library palette
  // ("Cards/Editorial", "Dashboard/Metrics", …). Always emit one; "Elements" is reserved by Canvas
  // for its own primitives, so never hand it back.
  const group = cat.category ? (cat.subcategory ? `${cat.category}/${cat.subcategory}` : cat.category) : "Other";
  doc.group = group === "Elements" ? "Elements/Components" : group;

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
 * @param {{ name: string, def: any, ast: any[], behavior: string|null, metadata?: any, canvas?: boolean }} input
 * @returns {Record<string, string>}  filename → contents (paths relative to the SDC dir)
 */
export function emitSdc({ name, def, ast, behavior, metadata, canvas = false }) {
  /** @type {Record<string,string>} */
  const files = {};
  const meta = metadata || {};
  const yml = behavior
    ? defToComponentYml(def, meta, { canvas }).replace(
        /\n$/,
        `\nlibraryOverrides:\n  js:\n    ${name}.js: {}\n`,
      )
    : defToComponentYml(def, meta, { canvas });
  files[`${name}.component.yml`] = yml;
  files[`${name}.twig`] = astToTwig(ast, def.variants || {}, { canvas, mediaProps: mediaPropNames(def) });
  if (behavior) files[`${name}.js`] = wrapPortable(name, behavior);
  return files;
}

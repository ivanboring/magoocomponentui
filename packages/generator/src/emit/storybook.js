/**
 * Storybook emitter (HTML renderer). The story renders the canonical markup via
 * the shared reference renderer + the compiled AST — no Twig/JSX engine needed.
 * Behavior is loaded by importing the portable SDC behavior (self-inits via
 * MutationObserver when the story sets innerHTML). Theme is applied by a global
 * decorator (see .storybook config).
 */

/** @param {string} name */
function pascal(name) {
  return name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

/** @param {any} prop @returns {any} */
function argType(prop) {
  switch (prop.type) {
    case "enum":
      return { control: { type: "select" }, options: prop.values };
    case "boolean":
      return { control: "boolean" };
    case "integer":
      return { control: "number" };
    case "array":
    case "object":
      return { control: "object" };
    default:
      return { control: "text" };
  }
}

/** @param {any} prop */
export function sampleValue(prop) {
  if (prop.example !== undefined) return prop.example;
  if (prop.default !== undefined) return prop.default;
  switch (prop.type) {
    case "string": return prop.title;
    case "text": return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    case "html": return "<strong>Rich</strong> text";
    case "integer": return 1;
    case "boolean": return false;
    case "enum": return prop.values[0];
    case "link": return "#";
    case "image": return "https://placehold.co/600x400";
    case "array": return [];
    case "object": return {};
    default: return "";
  }
}

/** @param {any} def */
export function defaultArgs(def) {
  /** @type {any} */
  const args = {};
  for (const p of def.props) args[p.name] = sampleValue(p);
  if (def.slots.length) {
    args.$slots = Object.fromEntries(def.slots.map((s) => [s.name, `<p>${s.title} content</p>`]));
  }
  return args;
}

/**
 * @param {{ name:string, def:any, metadata?:any, behavior:boolean, examples?:Record<string,any> }} input
 */
export function emitStorybook({ name, def, metadata, behavior, examples }) {
  const Comp = pascal(name);
  const group = (metadata && metadata.categorization && metadata.categorization.category) || "Components";
  const argTypes = Object.fromEntries(def.props.map((p) => [p.name, argType(p)]));

  const namedExamples = examples && Object.keys(examples).length ? examples : { Default: defaultArgs(def) };
  const storyExports = Object.entries(namedExamples)
    .map(([storyName, args]) => {
      const exportName = pascal(storyName);
      return `export const ${exportName} = Template.bind({});\n${exportName}.args = ${JSON.stringify(args, null, 2)};`;
    })
    .join("\n\n");

  const behaviorImport = behavior ? `import "../sdc/${name}/${name}.js";\n` : "";

  return `import { renderToHtml } from "@magoo/generator";
import ast from "../ast.json";
import meta from "../meta.json";
${behaviorImport}
export default {
  title: "${group}/${Comp}",
  argTypes: ${JSON.stringify(argTypes, null, 2)},
};

const Template = (args) => renderToHtml(ast, { ...args, $variants: meta.def.variants });

${storyExports}
`;
}

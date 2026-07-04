/**
 * @magoo/generator — one canonical source → every target.
 *
 * generate() parses a component's template + def and emits the full file set:
 *   ast.json                     compiled template AST (powers preview + Storybook)
 *   meta.json                    id/name/def/metadata (powers preview)
 *   sdc/<name>/<name>.component.yml | .twig | .js
 *   code-component/<name>.jsx    Preact (Drupal Code Component)
 *   react/<name>.jsx
 *   vue/<name>.vue
 *   stories/<name>.stories.js
 */
import { parseTemplate, parseInterpolation } from "./parser.js";
import { normalizeDef, loadDef } from "./def.js";
import { renderToHtml, renderNodes } from "./render.js";
import { emitSdc, defToComponentYml } from "./emit/sdc.js";
import { emitJsx } from "./emit/jsx.js";
import { emitVue } from "./emit/vue.js";
import { emitStorybook, defaultArgs, sampleValue } from "./emit/storybook.js";
import { emitDrupal } from "./emit/drupal.js";
import { astToTwig } from "./emit/twig.js";
import { wrapPortable } from "./emit/behavior.js";

export {
  parseTemplate,
  parseInterpolation,
  normalizeDef,
  loadDef,
  renderToHtml,
  renderNodes,
  emitSdc,
  defToComponentYml,
  emitJsx,
  emitVue,
  emitStorybook,
  emitDrupal,
  astToTwig,
  wrapPortable,
  defaultArgs,
  sampleValue,
};

/**
 * @param {{
 *   id: string,
 *   name?: string,
 *   def: any,          // normalized component.def
 *   template: string,  // template.html contents
 *   behavior?: string|null,
 *   metadata?: any,
 *   examples?: Record<string, any>|null,
 * }} source
 * @returns {{ ast: any[], files: Record<string, string> }}
 */
export function generate(source) {
  const name = source.name || source.def.name;
  const behavior = source.behavior || null;
  const metadata = source.metadata || {};
  const ast = parseTemplate(source.template);

  /** @type {Record<string, string>} */
  const files = {};
  files["ast.json"] = JSON.stringify(ast, null, 0);
  files["meta.json"] = JSON.stringify(
    { id: source.id, name, def: source.def, metadata },
    null,
    2,
  );

  for (const [file, contents] of Object.entries(
    emitSdc({ name, def: source.def, ast, behavior, metadata }),
  )) {
    files[`sdc/${name}/${file}`] = contents;
  }

  files[`code-component/${name}.jsx`] = emitJsx({ name, def: source.def, ast, behavior, mode: "preact" });
  files[`react/${name}.jsx`] = emitJsx({ name, def: source.def, ast, behavior, mode: "react" });
  files[`vue/${name}.vue`] = emitVue({ name, def: source.def, ast, behavior });
  files[`stories/${name}.stories.js`] = emitStorybook({
    name,
    def: source.def,
    metadata,
    behavior: Boolean(behavior),
    examples: source.examples || null,
  });

  for (const [file, contents] of Object.entries(
    emitDrupal({ name, def: source.def, ast, metadata }),
  )) {
    files[`drupal/${file}`] = contents;
  }

  return { ast, files };
}

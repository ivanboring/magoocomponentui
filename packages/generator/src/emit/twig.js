/**
 * AST → Twig (for SDC). Directives map to Twig control structures; slots use the
 * SDC `{% block %}` form so fallback content is preserved as the default.
 * `{{ prop@class }}` becomes a Twig ternary chain over the def's variants map.
 */

/** @param {string} prop @param {Record<string,string>} map */
function classTernary(prop, map) {
  const entries = Object.entries(map);
  if (!entries.length) return "''";
  return entries.reduceRight(
    (acc, [value, classes]) => `${prop} == '${value}' ? '${classes}' : (${acc})`,
    "''",
  );
}

/** @param {any[]} parts @param {Record<string,any>} variants */
function partsToTwig(parts, variants) {
  let out = "";
  for (const p of parts) {
    if (p.kind === "literal") out += p.value;
    else if (p.kind === "expr") out += `{{ ${p.path} }}`;
    else if (p.kind === "raw") out += `{{ ${p.path}|raw }}`;
    else if (p.kind === "classmap") out += `{{ ${classTernary(p.prop, variants[p.prop] || {})} }}`;
  }
  return out;
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node @param {Record<string,any>} variants */
function nodeToTwig(node, variants) {
  if (node.type === "text") return partsToTwig(node.parts, variants);
  if (node.type === "slot") {
    const fallback = nodesToTwig(node.fallback, variants);
    return `{% block ${node.name} %}${fallback}{% endblock %}`;
  }
  if (node.type !== "element") return "";

  let attrs = "";
  for (const a of node.attrs) attrs += ` ${a.name}="${partsToTwig(a.parts, variants)}"`;
  const inner = VOID.has(node.tag.toLowerCase())
    ? `<${node.tag}${attrs}>`
    : `<${node.tag}${attrs}>${nodesToTwig(node.children, variants)}</${node.tag}>`;

  let out = inner;
  const dir = node.directives || {};
  if (dir.for) out = `{% for ${dir.for.item} in ${dir.for.list} %}${out}{% endfor %}`;
  if (dir.if) {
    const cond = dir.if.negate ? `not ${dir.if.path}` : dir.if.path;
    out = `{% if ${cond} %}${out}{% endif %}`;
  }
  return out;
}

/** @param {any[]} nodes @param {Record<string,any>} [variants] */
export function nodesToTwig(nodes, variants = {}) {
  return nodes.map((n) => nodeToTwig(n, variants)).join("");
}

/** @param {any[]} ast @param {Record<string,any>} [variants] */
export function astToTwig(ast, variants = {}) {
  return nodesToTwig(ast, variants).trim() + "\n";
}

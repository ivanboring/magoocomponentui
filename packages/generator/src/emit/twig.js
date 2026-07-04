/**
 * AST → Twig (for SDC). Directives map to Twig control structures; slots use the
 * SDC `{% block %}` form so fallback content is preserved as the default.
 */

/** @param {any[]} parts @param {boolean} inAttr */
function partsToTwig(parts, inAttr) {
  let out = "";
  for (const p of parts) {
    if (p.kind === "literal") out += p.value;
    else if (p.kind === "expr") out += `{{ ${p.path} }}`;
    else if (p.kind === "raw") out += `{{ ${p.path}|raw }}`;
  }
  return out;
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node */
function nodeToTwig(node) {
  if (node.type === "text") return partsToTwig(node.parts, false);
  if (node.type === "slot") {
    const fallback = nodesToTwig(node.fallback);
    return `{% block ${node.name} %}${fallback}{% endblock %}`;
  }
  if (node.type !== "element") return "";

  let attrs = "";
  for (const a of node.attrs) attrs += ` ${a.name}="${partsToTwig(a.parts, true)}"`;
  const inner = VOID.has(node.tag.toLowerCase())
    ? `<${node.tag}${attrs}>`
    : `<${node.tag}${attrs}>${nodesToTwig(node.children)}</${node.tag}>`;

  let out = inner;
  const dir = node.directives || {};
  if (dir.for) out = `{% for ${dir.for.item} in ${dir.for.list} %}${out}{% endfor %}`;
  if (dir.if) {
    const cond = dir.if.negate ? `not ${dir.if.path}` : dir.if.path;
    out = `{% if ${cond} %}${out}{% endif %}`;
  }
  return out;
}

/** @param {any[]} nodes */
export function nodesToTwig(nodes) {
  return nodes.map(nodeToTwig).join("");
}

/** @param {any[]} ast */
export function astToTwig(ast) {
  return nodesToTwig(ast).trim() + "\n";
}

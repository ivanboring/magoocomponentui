/**
 * Reference AST → HTML renderer.
 * -----------------------------
 * Framework-agnostic interpreter that turns a parsed template AST + a data scope
 * into an HTML string. This is the single source of truth used by BOTH the static
 * preview site and Storybook, so no Twig/JSX engine is needed just to see a component.
 *
 * scope: plain object of prop values, plus optional `$slots: { name: htmlString }`.
 */

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {any} scope @param {string} path */
function resolve(scope, path) {
  let cur = scope;
  for (const key of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

/** @param {any[]} parts @param {any} scope @param {boolean} forAttr */
function renderParts(parts, scope, forAttr) {
  let out = "";
  for (const part of parts) {
    if (part.kind === "literal") out += part.value;
    else if (part.kind === "expr") {
      const v = resolve(scope, part.path);
      out += escapeHtml(v == null ? "" : v);
    } else if (part.kind === "raw") {
      const v = resolve(scope, part.path);
      out += v == null ? "" : String(v); // intentionally unescaped
    } else if (part.kind === "classmap") {
      const map = scope.$variants && scope.$variants[part.prop];
      const value = resolve(scope, part.prop);
      out += (map && map[value]) || ""; // author-controlled class string
    }
  }
  return out;
}

/** @param {any} node @param {any} scope */
function renderElement(node, scope) {
  let attrs = "";
  for (const attr of node.attrs) {
    attrs += ` ${attr.name}="${renderParts(attr.parts, scope, true)}"`;
  }
  const open = `<${node.tag}${attrs}>`;
  if (VOID.has(node.tag.toLowerCase())) return open;
  return `${open}${renderNodes(node.children, scope)}</${node.tag}>`;
}

/** @param {any} node @param {any} scope */
function renderNode(node, scope) {
  if (node.type === "text") return renderParts(node.parts, scope, false);
  if (node.type === "slot") {
    const provided = scope.$slots && scope.$slots[node.name];
    if (provided != null) return String(provided);
    return renderNodes(node.fallback, scope);
  }
  if (node.type === "element") {
    const dir = node.directives || {};
    if (dir.if) {
      const truthy = Boolean(resolve(scope, dir.if.path));
      if (dir.if.negate ? truthy : !truthy) return "";
    }
    if (dir.for) {
      const list = resolve(scope, dir.for.list);
      if (!Array.isArray(list)) return "";
      const bare = { ...node, directives: { ...dir, for: undefined } };
      return list
        .map((item, i) => renderElement(bare, { ...scope, [dir.for.item]: item, $index: i }))
        .join("");
    }
    return renderElement(node, scope);
  }
  return "";
}

/** @param {any[]} nodes @param {any} scope */
export function renderNodes(nodes, scope) {
  return nodes.map((n) => renderNode(n, scope)).join("");
}

/**
 * @param {any[]} ast  parsed template (array of top-level nodes)
 * @param {Record<string, any>} [scope]
 * @returns {string}
 */
export function renderToHtml(ast, scope = {}) {
  return renderNodes(ast, scope);
}

/**
 * Template parser.
 * ----------------
 * Parses a component's `template.html` (tokenized-Tailwind markup + a minimal
 * directive vocabulary) into a target-agnostic AST that each emitter walks.
 *
 * Directive vocabulary (intentionally small — deterministically transpilable to
 * Twig / JSX / Vue; expressions are dotted paths + `!` negation only, no arbitrary JS):
 *
 *   {{ path }}                 text / attribute interpolation
 *   {{{ path }}}               raw-HTML interpolation (text position only)
 *   <slot name="x">…</slot>    named slot, children are fallback content
 *   data-if="path"             render element only when path is truthy
 *   data-if="!path"            render element only when path is falsy
 *   data-for="item in items"   repeat element for each entry of items (scope var `item`)
 *
 * AST node shapes (all plain, JSON-serializable objects):
 *   { type: 'element', tag, attrs: Attr[], children: Node[], directives: { if?, for? } }
 *   { type: 'text', parts: Part[] }
 *   { type: 'slot', name, fallback: Node[] }
 *
 *   Attr  = { name: string, parts: Part[] }
 *   Part  = { kind: 'literal', value: string }
 *         | { kind: 'expr', path: string }      // {{ path }}
 *         | { kind: 'raw', path: string }        // {{{ path }}}
 *   if    = { path: string, negate: boolean }
 *   for   = { item: string, list: string }
 */

import { parse } from "node-html-parser";

const PATH_RE = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;

/**
 * Split a raw string into interpolation parts.
 * Handles triple `{{{ }}}` (raw) before double `{{ }}` (expr).
 * @param {string} input
 * @returns {Array<{kind:'literal',value:string}|{kind:'expr',path:string}|{kind:'raw',path:string}>}
 */
export function parseInterpolation(input) {
  /** @type {Array<{kind:string,value?:string,path?:string}>} */
  const parts = [];
  const re = /\{\{\{\s*([^}]+?)\s*\}\}\}|\{\{\s*([^}]+?)\s*\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      parts.push({ kind: "literal", value: input.slice(last, m.index) });
    }
    const raw = m[1] !== undefined;
    const path = (raw ? m[1] : m[2]).trim();
    const classMatch = /^([A-Za-z_][A-Za-z0-9_]*)@class$/.exec(path);
    if (classMatch && !raw) {
      parts.push({ kind: "classmap", prop: classMatch[1] });
    } else if (PATH_RE.test(path)) {
      parts.push(raw ? { kind: "raw", path } : { kind: "expr", path });
    } else {
      throw new Error(
        `Invalid interpolation expression "${path}". Only dotted paths (e.g. item.title) or \`prop@class\` are allowed.`,
      );
    }
    last = re.lastIndex;
  }
  if (last < input.length) {
    parts.push({ kind: "literal", value: input.slice(last) });
  }
  if (parts.length === 0) parts.push({ kind: "literal", value: "" });
  return parts;
}

/**
 * @param {string} expr  e.g. "item in items"
 * @returns {{item:string, list:string}}
 */
function parseFor(expr) {
  const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([A-Za-z_][A-Za-z0-9_.]*)\s*$/.exec(expr);
  if (!m) {
    throw new Error(`Invalid data-for "${expr}". Expected "item in items".`);
  }
  return { item: m[1], list: m[2] };
}

/**
 * @param {string} expr  e.g. "featured" or "!featured"
 * @returns {{path:string, negate:boolean}}
 */
function parseIf(expr) {
  const negate = expr.trim().startsWith("!");
  const path = expr.trim().replace(/^!/, "").trim();
  if (!PATH_RE.test(path)) {
    throw new Error(`Invalid data-if "${expr}". Only dotted paths (optionally negated) are allowed.`);
  }
  return { path, negate };
}

/** @param {any} node */
function isElement(node) {
  return node.nodeType === 1;
}
/** @param {any} node */
function isText(node) {
  return node.nodeType === 3;
}

/** @param {any} node @returns {any[]} */
function walkChildren(node) {
  const out = [];
  for (const child of node.childNodes) {
    const built = walk(child);
    if (built) out.push(built);
  }
  return out;
}

/** @param {any} node @returns {any|null} */
function walk(node) {
  if (isText(node)) {
    const raw = node.rawText;
    if (raw === "") return null;
    return { type: "text", parts: parseInterpolation(raw) };
  }
  if (!isElement(node)) return null; // comments etc.

  const tag = node.rawTagName;

  if (tag && tag.toLowerCase() === "slot") {
    return {
      type: "slot",
      name: node.getAttribute("name") || "default",
      fallback: walkChildren(node),
    };
  }

  const attrsObj = node.attributes || {};
  /** @type {{if?:any, for?:any}} */
  const directives = {};
  /** @type {Array<{name:string, parts:any[]}>} */
  const attrs = [];
  for (const [name, value] of Object.entries(attrsObj)) {
    if (name === "data-if") {
      directives.if = parseIf(String(value));
      continue;
    }
    if (name === "data-for") {
      directives.for = parseFor(String(value));
      continue;
    }
    attrs.push({ name, parts: parseInterpolation(String(value)) });
  }

  return {
    type: "element",
    tag,
    attrs,
    directives,
    children: walkChildren(node),
  };
}

/**
 * Parse a component template into an AST (array of top-level nodes).
 * @param {string} html
 * @returns {any[]}
 */
export function parseTemplate(html) {
  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: { script: true, style: true },
  });
  return walkChildren(root);
}

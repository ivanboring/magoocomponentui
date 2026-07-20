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

/**
 * Twig stringifies a boolean when it prints it: `true` → "1", `false` → "" — so
 * `data-featured="{{ featured }}"` renders `data-featured="1"` / `data-featured=""`,
 * which NEVER matches the component's Tailwind `data-[featured=true]` /
 * `data-[featured=false]` variants (the documented convention for JS-driven and
 * boolean states), and the same goes for the ARIA state attributes, which are
 * specified as the literal strings "true"/"false".
 *
 * So inside a `data-*` / `aria-*` attribute we print a boolean-safe expression:
 * a real boolean becomes the literal string, and anything else (a string — e.g. the
 * "true"/"false" values stored in a custom_field string column —, a number, null)
 * prints exactly as before. `same as` is an identity test, so no double-handling.
 *
 * The prop itself is untouched: `data-if="prop"` still gets the raw boolean and the
 * SDC schema can keep `type: boolean` (strict prop validation would reject a string).
 * @param {string} path
 */
function boolSafe(path) {
  return `${path} is same as(true) ? 'true' : (${path} is same as(false) ? 'false' : ${path})`;
}

/** @param {string} [attrName] */
function isStateAttr(attrName) {
  return typeof attrName === "string" && /^(data|aria)-/.test(attrName);
}

/**
 * Under Canvas an image/video prop is a media OBJECT, so a bare interpolation of that prop resolves
 * to its `.src`. An explicitly authored sub-path (`{{ image.alt }}`) is left alone.
 * @param {string} path @param {{ canvas?: boolean, mediaProps?: Set<string> }} opts
 */
function mediaPath(path, opts) {
  return opts.canvas && opts.mediaProps && opts.mediaProps.has(path) ? `${path}.src` : path;
}

/** @param {any[]} parts @param {Record<string,any>} variants @param {string} [attrName] @param {any} [opts] */
function partsToTwig(parts, variants, attrName, opts = {}) {
  const stateAttr = isStateAttr(attrName);
  let out = "";
  for (const p of parts) {
    if (p.kind === "literal") out += p.value;
    else if (p.kind === "expr") { const path = mediaPath(p.path, opts); out += stateAttr ? `{{ ${boolSafe(path)} }}` : `{{ ${path} }}`; }
    else if (p.kind === "raw") out += `{{ ${p.path}|raw }}`;
    else if (p.kind === "classmap") out += `{{ ${classTernary(p.prop, variants[p.prop] || {})} }}`;
  }
  return out;
}

const MEDIA_SRC_ATTRS = new Set(["src", "poster", "data-src"]);

/**
 * If an <img> takes its src/poster from a media prop, find that prop so we can supply the media
 * entity's own alt text when the markup has none.
 * @param {any} node @param {any} opts
 */
function mediaSrcProp(node, opts) {
  if (!opts.canvas || !opts.mediaProps) return null;
  for (const a of node.attrs) {
    if (MEDIA_SRC_ATTRS.has(a.name.toLowerCase()) && a.parts.length === 1 &&
        a.parts[0].kind === "expr" && opts.mediaProps.has(a.parts[0].path)) {
      return a.parts[0].path;
    }
  }
  return null;
}

/** @param {any} parts @returns {boolean} an empty attribute value (no parts, or a single "" literal) */
function isEmptyAttr(parts) {
  return parts.length === 0 || (parts.length === 1 && parts[0].kind === "literal" && parts[0].value === "");
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node @param {Record<string,any>} variants @param {any} [opts] */
function nodeToTwig(node, variants, opts = {}) {
  if (node.type === "text") return partsToTwig(node.parts, variants, undefined, opts);
  if (node.type === "slot") {
    const fallback = nodesToTwig(node.fallback, variants, opts);
    return `{% block ${node.name} %}${fallback}{% endblock %}`;
  }
  if (node.type !== "element") return "";

  const isImg = node.tag.toLowerCase() === "img";
  const altProp = isImg ? mediaSrcProp(node, opts) : null;
  let altSeen = false;
  let attrs = "";
  for (const a of node.attrs) {
    // An <img> fed by a media prop but with an empty/absent alt gets the media entity's own alt.
    if (altProp && a.name.toLowerCase() === "alt") {
      altSeen = true;
      if (isEmptyAttr(a.parts)) { attrs += ` alt="{{ ${altProp}.alt }}"`; continue; }
    }
    attrs += ` ${a.name}="${partsToTwig(a.parts, variants, a.name, opts)}"`;
  }
  if (altProp && !altSeen) attrs += ` alt="{{ ${altProp}.alt }}"`;
  const inner = VOID.has(node.tag.toLowerCase())
    ? `<${node.tag}${attrs}>`
    : `<${node.tag}${attrs}>${nodesToTwig(node.children, variants, opts)}</${node.tag}>`;

  let out = inner;
  const dir = node.directives || {};
  if (dir.for) out = `{% for ${dir.for.item} in ${dir.for.list} %}${out}{% endfor %}`;
  if (dir.if) {
    const cond = dir.if.negate ? `not ${dir.if.path}` : dir.if.path;
    out = `{% if ${cond} %}${out}{% endif %}`;
  }
  return out;
}

/** @param {any[]} nodes @param {Record<string,any>} [variants] @param {any} [opts] */
export function nodesToTwig(nodes, variants = {}, opts = {}) {
  return nodes.map((n) => nodeToTwig(n, variants, opts)).join("");
}

/**
 * @param {any[]} ast @param {Record<string,any>} [variants]
 * @param {{ canvas?: boolean, mediaProps?: Set<string> }} [opts]  canvas:true rewrites media props to `.src`
 */
export function astToTwig(ast, variants = {}, opts = {}) {
  return nodesToTwig(ast, variants, opts).trim() + "\n";
}

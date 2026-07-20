/**
 * AST → JSX. Shared by the React and Preact (Drupal Code Component) emitters;
 * only the import header and behavior-hook wiring differ by `mode`.
 * `{{ prop@class }}` becomes an inline `({...}[prop] || "")` map expression.
 */

const ATTR_RENAME = { class: "className", for: "htmlFor" };

/** @param {string} name */
function pascal(name) {
  return name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

/** escape a literal for use inside a JS template literal */
function escTpl(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

/** @param {any} part @param {Record<string,any>} variants */
function mapExpr(part, variants) {
  return `(${JSON.stringify(variants[part.prop] || {})}[${part.prop}] || "")`;
}

/**
 * Code Components run inside Canvas, which passes an image/video prop as a media OBJECT — so a bare
 * reference resolves to its `.src`. React (media:false) keeps the plain-string shape.
 * @param {string} path @param {any} opts
 */
function mediaExpr(path, opts) {
  return opts.media && opts.mediaProps && opts.mediaProps.has(path) ? `${path}.src` : path;
}

/** @param {any} attr @param {Record<string,any>} variants @param {any} [opts] */
function attrToJsx(attr, variants, opts = {}) {
  const name = ATTR_RENAME[attr.name] || attr.name;
  const parts = attr.parts;
  if (parts.length === 1) {
    const p = parts[0];
    if (p.kind === "literal") return p.value.includes('"') ? `${name}={${JSON.stringify(p.value)}}` : `${name}="${p.value}"`;
    if (p.kind === "expr") return `${name}={${mediaExpr(p.path, opts)}}`;
    if (p.kind === "classmap") return `${name}={${mapExpr(p, variants)}}`;
  }
  const tpl = parts
    .map((p) => {
      if (p.kind === "literal") return escTpl(p.value);
      if (p.kind === "expr") return `\${${mediaExpr(p.path, opts)}}`;
      return `\${${mapExpr(p, variants)}}`;
    })
    .join("");
  return `${name}={\`${tpl}\`}`;
}

const MEDIA_SRC_ATTRS = new Set(["src", "poster", "data-src"]);

/**
 * The media prop feeding an <img>'s src/poster, so we can supply its alt when the markup has none.
 * @param {any} node @param {any} opts
 */
function jsxMediaSrcProp(node, opts) {
  if (!opts.media || !opts.mediaProps) return null;
  for (const a of node.attrs) {
    if (MEDIA_SRC_ATTRS.has(a.name.toLowerCase()) && a.parts.length === 1 &&
        a.parts[0].kind === "expr" && opts.mediaProps.has(a.parts[0].path)) {
      return a.parts[0].path;
    }
  }
  return null;
}

/** @param {any} parts */
function jsxEmptyAttr(parts) {
  return parts.length === 0 || (parts.length === 1 && parts[0].kind === "literal" && parts[0].value === "");
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node @param {Record<string,any>} variants @param {any} [opts] */
function nodeToJsx(node, variants, opts = {}) {
  if (node.type === "text") {
    return node.parts
      .map((p) => {
        if (p.kind === "literal") return p.value;
        if (p.kind === "expr") return `{${mediaExpr(p.path, opts)}}`;
        if (p.kind === "classmap") return `{${mapExpr(p, variants)}}`;
        return `<span dangerouslySetInnerHTML={{ __html: ${p.path} }} />`;
      })
      .join("");
  }
  if (node.type === "slot") return `{${node.name}}`;
  if (node.type !== "element") return "";

  const isImg = node.tag.toLowerCase() === "img";
  const altProp = isImg ? jsxMediaSrcProp(node, opts) : null;
  let altSeen = false;
  const attrParts = [];
  for (const a of node.attrs) {
    if (altProp && (ATTR_RENAME[a.name] || a.name).toLowerCase() === "alt") {
      altSeen = true;
      if (jsxEmptyAttr(a.parts)) { attrParts.push(`alt={${altProp}.alt}`); continue; }
    }
    attrParts.push(attrToJsx(a, variants, opts));
  }
  if (altProp && !altSeen) attrParts.push(`alt={${altProp}.alt}`);
  let attrs = attrParts.join(" ");
  if (node.__ref) attrs = `ref={rootRef}${attrs ? " " + attrs : ""}`;
  const open = attrs ? `<${node.tag} ${attrs}` : `<${node.tag}`;
  const el = VOID.has(node.tag.toLowerCase())
    ? `${open} />`
    : `${open}>${node.children.map((c) => nodeToJsx(c, variants, opts)).join("")}</${node.tag}>`;

  let out = el;
  const dir = node.directives || {};
  if (dir.for) out = `{${dir.for.list}.map((${dir.for.item}, $index) => (${withKey(out)}))}`;
  if (dir.if) out = `{${dir.if.negate ? "!" : ""}${dir.if.path} && (${out})}`;
  return out;
}

/** inject key={$index} into the opening tag of a for-body */
function withKey(jsx) {
  return jsx.replace(/^<(\w[\w-]*)/, "<$1 key={$index}");
}

/**
 * @param {{ name:string, def:any, ast:any[], behavior:string|null, mode:'react'|'preact' }} input
 */
export function emitJsx({ name, def, ast, behavior, mode }) {
  const Comp = pascal(name);
  const variants = def.variants || {};
  const slotNames = def.slots.map((s) => s.name);
  const propNames = def.props.map((p) => p.name);
  const params = [...propNames, ...slotNames];

  const tree = JSON.parse(JSON.stringify(ast));
  if (behavior) {
    const first = tree.find((n) => n.type === "element");
    if (first) first.__ref = true;
  }
  // Code Components (mode:preact) render inside Canvas, where image/video props arrive as media
  // objects; the React target proves generality with plain-string props, so it opts out.
  const opts = {
    media: mode === "preact",
    mediaProps: new Set(def.props.filter((p) => p.type === "image" || p.type === "video").map((p) => p.name)),
  };
  const body = tree.map((n) => nodeToJsx(n, variants, opts)).join("\n      ");

  const header =
    mode === "react"
      ? `import React${behavior ? ", { useEffect, useRef }" : ""} from "react";`
      : `/** @jsxImportSource preact */\n${behavior ? 'import { useEffect, useRef } from "preact/hooks";\n' : ""}`;

  const destructure = params.length ? `{ ${params.join(", ")} }` : "props";

  const effect = behavior
    ? `  const rootRef = useRef(null);
  useEffect(() => {
    if (!rootRef.current) return;
    return init(rootRef.current, { ${propNames.join(", ")} });
  }, []);
`
    : "";

  const initFn = behavior ? inlineInit(behavior) + "\n\n" : "";

  return `${header}
${initFn}export default function ${Comp}(${destructure}) {
${effect}  return (
    <>
      ${body}
    </>
  );
}
`;
}

/** Turn the authored behavior.js into a module-scope `init` function. */
function inlineInit(source) {
  const t = source.trim();
  if (/export\s+default\s+function\s+init\b/.test(t)) return t.replace(/export\s+default\s+function\s+init\b/, "function init");
  if (/export\s+default\s+function\b/.test(t)) return t.replace(/export\s+default\s+function\b/, "function init");
  return t.replace(/export\s+default\s+/, "const init = ");
}

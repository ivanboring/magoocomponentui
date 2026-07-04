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

/** @param {any} attr @param {Record<string,any>} variants */
function attrToJsx(attr, variants) {
  const name = ATTR_RENAME[attr.name] || attr.name;
  const parts = attr.parts;
  if (parts.length === 1) {
    const p = parts[0];
    if (p.kind === "literal") return p.value.includes('"') ? `${name}={${JSON.stringify(p.value)}}` : `${name}="${p.value}"`;
    if (p.kind === "expr") return `${name}={${p.path}}`;
    if (p.kind === "classmap") return `${name}={${mapExpr(p, variants)}}`;
  }
  const tpl = parts
    .map((p) => {
      if (p.kind === "literal") return escTpl(p.value);
      if (p.kind === "expr") return `\${${p.path}}`;
      return `\${${mapExpr(p, variants)}}`;
    })
    .join("");
  return `${name}={\`${tpl}\`}`;
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node @param {Record<string,any>} variants */
function nodeToJsx(node, variants) {
  if (node.type === "text") {
    return node.parts
      .map((p) => {
        if (p.kind === "literal") return p.value;
        if (p.kind === "expr") return `{${p.path}}`;
        if (p.kind === "classmap") return `{${mapExpr(p, variants)}}`;
        return `<span dangerouslySetInnerHTML={{ __html: ${p.path} }} />`;
      })
      .join("");
  }
  if (node.type === "slot") return `{${node.name}}`;
  if (node.type !== "element") return "";

  let attrs = node.attrs.map((a) => attrToJsx(a, variants)).join(" ");
  if (node.__ref) attrs = `ref={rootRef}${attrs ? " " + attrs : ""}`;
  const open = attrs ? `<${node.tag} ${attrs}` : `<${node.tag}`;
  const el = VOID.has(node.tag.toLowerCase())
    ? `${open} />`
    : `${open}>${node.children.map((c) => nodeToJsx(c, variants)).join("")}</${node.tag}>`;

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
  const body = tree.map((n) => nodeToJsx(n, variants)).join("\n      ");

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

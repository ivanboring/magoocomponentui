/**
 * AST → JSX. Shared by the React and Preact (Drupal Code Component) emitters;
 * only the import header and behavior-hook wiring differ by `mode`.
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

/** @param {any} attr */
function attrToJsx(attr) {
  const name = ATTR_RENAME[attr.name] || attr.name;
  const parts = attr.parts;
  if (parts.length === 1 && parts[0].kind === "literal") {
    const v = parts[0].value;
    return v.includes('"') ? `${name}={${JSON.stringify(v)}}` : `${name}="${v}"`;
  }
  if (parts.length === 1 && parts[0].kind === "expr") {
    return `${name}={${parts[0].path}}`;
  }
  const tpl = parts
    .map((p) => (p.kind === "literal" ? escTpl(p.value) : `\${${p.path}}`))
    .join("");
  return `${name}={\`${tpl}\`}`;
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node */
function nodeToJsx(node) {
  if (node.type === "text") {
    return node.parts
      .map((p) => {
        if (p.kind === "literal") return p.value;
        if (p.kind === "expr") return `{${p.path}}`;
        return `<span dangerouslySetInnerHTML={{ __html: ${p.path} }} />`;
      })
      .join("");
  }
  if (node.type === "slot") {
    return `{${node.name}}`;
  }
  if (node.type !== "element") return "";

  let attrs = node.attrs.map(attrToJsx).join(" ");
  if (node.__ref) attrs = `ref={rootRef}${attrs ? " " + attrs : ""}`;
  const open = attrs ? `<${node.tag} ${attrs}` : `<${node.tag}`;
  const el = VOID.has(node.tag.toLowerCase())
    ? `${open} />`
    : `${open}>${node.children.map(nodeToJsx).join("")}</${node.tag}>`;

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
  const slotNames = def.slots.map((s) => s.name);
  const propNames = def.props.map((p) => p.name);
  const params = [...propNames, ...slotNames];

  // Mark the first top-level element to receive the behavior ref.
  const tree = JSON.parse(JSON.stringify(ast));
  if (behavior) {
    const first = tree.find((n) => n.type === "element");
    if (first) first.__ref = true;
  }
  const body = tree.map(nodeToJsx).join("\n      ");

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

/**
 * AST → Vue Single File Component. Vue's own mustache + v-if/v-for/v-html/<slot>
 * map almost 1:1 onto our directive vocabulary.
 */

/** @param {string} name */
function pascal(name) {
  return name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${").replace(/"/g, "&quot;");
}

/** @param {any} attr */
function attrToVue(attr) {
  const parts = attr.parts;
  if (parts.length === 1 && parts[0].kind === "literal") {
    return `${attr.name}="${parts[0].value.replace(/"/g, "&quot;")}"`;
  }
  if (parts.length === 1 && parts[0].kind === "expr") {
    return `:${attr.name}="${parts[0].path}"`;
  }
  const tpl = parts.map((p) => (p.kind === "literal" ? esc(p.value) : "${" + p.path + "}")).join("");
  return `:${attr.name}="\`${tpl}\`"`;
}

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** @param {any} node */
function nodeToVue(node) {
  if (node.type === "text") {
    return node.parts
      .map((p) => {
        if (p.kind === "literal") return p.value;
        if (p.kind === "expr") return `{{ ${p.path} }}`;
        return `<span v-html="${p.path}"></span>`;
      })
      .join("");
  }
  if (node.type === "slot") {
    const fallback = node.fallback.map(nodeToVue).join("");
    return `<slot name="${node.name}">${fallback}</slot>`;
  }
  if (node.type !== "element") return "";

  const dir = node.directives || {};
  const parts = [`<${node.tag}`];
  if (node.__ref) parts.push('ref="root"');
  if (dir.for) parts.push(`v-for="(${dir.for.item}, $index) in ${dir.for.list}"`, ':key="$index"');
  if (dir.if) parts.push(`v-if="${dir.if.negate ? "!" : ""}${dir.if.path}"`);
  for (const a of node.attrs) parts.push(attrToVue(a));
  const open = parts.join(" ");

  if (VOID.has(node.tag.toLowerCase())) return `${open} />`;
  return `${open}>${node.children.map(nodeToVue).join("")}</${node.tag}>`;
}

const VUE_TYPE = {
  string: "String", html: "String", text: "String", link: "String", enum: "String",
  integer: "Number", boolean: "Boolean", array: "Array", object: "Object",
  image: "[String, Object]",
};

/** @param {any} def */
function defToVueProps(def) {
  const lines = def.props.map((p) => {
    const bits = [`type: ${VUE_TYPE[p.type] || "String"}`];
    if (p.required) bits.push("required: true");
    if (p.default !== undefined) bits.push(`default: ${JSON.stringify(p.default)}`);
    return `  ${p.name}: { ${bits.join(", ")} },`;
  });
  return `defineProps({\n${lines.join("\n")}\n})`;
}

/**
 * @param {{ name:string, def:any, ast:any[], behavior:string|null }} input
 */
export function emitVue({ name, def, ast, behavior }) {
  const tree = JSON.parse(JSON.stringify(ast));
  if (behavior) {
    const first = tree.find((n) => n.type === "element");
    if (first) first.__ref = true;
  }
  const template = tree.map(nodeToVue).join("\n  ");

  const propNames = def.props.map((p) => p.name);
  let script = `const props = ${defToVueProps(def)}`;
  if (behavior) {
    script = `import { onMounted, onUnmounted, ref } from "vue";
${inlineInit(behavior)}

const props = ${defToVueProps(def)}
const root = ref(null);
let cleanup;
onMounted(() => { cleanup = init(root.value, { ${propNames.join(", ")} }); });
onUnmounted(() => { if (typeof cleanup === "function") cleanup(); });`;
  }

  return `<template>
  ${template}
</template>

<script setup>
${script}
</script>
`;
}

function inlineInit(source) {
  const t = source.trim();
  if (/export\s+default\s+function\s+init\b/.test(t)) return t.replace(/export\s+default\s+function\s+init\b/, "function init");
  if (/export\s+default\s+function\b/.test(t)) return t.replace(/export\s+default\s+function\b/, "function init");
  return t.replace(/export\s+default\s+/, "const init = ");
}

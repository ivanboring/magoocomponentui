import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defaultArgs, renderToHtml } from "@magoo/generator";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIST = path.join(ROOT, "dist");

const EMPTY = { count: 0, components: [], facets: { categories: {}, atomic_types: [], usage_types: [] } };

export function loadCatalog() {
  const p = path.join(DIST, "catalog.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : EMPTY;
}

/** Read a component's portable behavior JS (self-inits in the browser), or null. */
function readBehavior(id, name) {
  const jsPath = path.join(DIST, id, "sdc", name, `${name}.js`);
  return existsSync(jsPath) ? readFileSync(jsPath, "utf8") : null;
}

/** The set of class tokens used anywhere in an HTML string. */
function classTokens(html) {
  const tokens = new Set();
  const re = /class=["']([^"']*)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    for (const t of m[1].split(/\s+/)) if (t) tokens.add(t);
  }
  return tokens;
}

/**
 * Behaviors to load for a composed preview: the component's own, plus any
 * catalog component whose hook class (== machine name) appears in the slot
 * markup. Slotted children (e.g. ticket-card inside ticket-selector) carry
 * their own behavior.js, so without this their interactivity would be inert.
 */
function collectBehaviors(id, name, slots) {
  const behaviors = [];
  const own = readBehavior(id, name);
  if (own) behaviors.push(own);

  const slotHtml = slots
    ? Object.values(slots).filter((v) => typeof v === "string").join(" ")
    : "";
  if (!slotHtml) return behaviors;

  const tokens = classTokens(slotHtml);
  for (const c of loadCatalog().components) {
    if (c.id === id || !tokens.has(c.name)) continue;
    const js = readBehavior(c.id, c.name);
    if (js && !behaviors.includes(js)) behaviors.push(js);
  }
  return behaviors;
}

/** Load render inputs for one component id (e.g. "notifications/alert"). */
export function loadRender(id) {
  const dir = path.join(DIST, id);
  const ast = JSON.parse(readFileSync(path.join(dir, "ast.json"), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const previewPath = path.join(dir, "preview.json");
  const base = existsSync(previewPath) ? JSON.parse(readFileSync(previewPath, "utf8")) : defaultArgs(meta.def);
  const args = { ...base, $variants: meta.def.variants };
  const behaviors = collectBehaviors(id, meta.name, base.$slots);
  return { ast, meta, args, behaviors };
}

/**
 * Load every named example for a component as its own renderable stage.
 * Falls back to the single default example (or generated default args) when the
 * component ships no examples/ folder. Each entry carries its own behaviors so a
 * variant that slots interactive children stays live.
 */
export function loadExamples(id) {
  const dir = path.join(DIST, id);
  const ast = JSON.parse(readFileSync(path.join(dir, "ast.json"), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const variants = meta.def.variants;
  const examplesPath = path.join(dir, "examples.json");

  /** @type {Record<string, any>} */
  let examples;
  if (existsSync(examplesPath)) {
    examples = JSON.parse(readFileSync(examplesPath, "utf8"));
  } else {
    const previewPath = path.join(dir, "preview.json");
    const base = existsSync(previewPath) ? JSON.parse(readFileSync(previewPath, "utf8")) : defaultArgs(meta.def);
    examples = { Default: base };
  }

  // "Default" first, then the rest in definition order.
  const names = Object.keys(examples).sort((a, b) => (a === "Default" ? -1 : b === "Default" ? 1 : 0));
  return { ast, names: names.map((name) => ({
    name,
    args: { ...examples[name], $variants: variants },
    behaviors: collectBehaviors(id, meta.name, examples[name].$slots),
  })) };
}

/**
 * Render a container component (e.g. card-grid, card-slider) with `innerHtml` slotted into
 * its `items` slot, plus any extra prop args. Returns the HTML and the container's behavior
 * JS (so sliders etc. work when injected). Returns null if the container isn't built.
 */
export function renderInContainer(containerId, innerHtml, extraArgs = {}) {
  const dir = path.join(DIST, containerId);
  if (!existsSync(path.join(dir, "ast.json"))) return null;
  const ast = JSON.parse(readFileSync(path.join(dir, "ast.json"), "utf8"));
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  // Slot into whichever child slot the container exposes — some use `plans` (e.g.
  // pricing-tiers) rather than `items`, so hardcoding `items` would drop the card.
  const slotName = (meta.def.slots || []).some((s) => s.name === "plans") ? "plans" : "items";
  const args = { ...defaultArgs(meta.def), ...extraArgs, $variants: meta.def.variants, $slots: { [slotName]: innerHtml } };
  return { html: renderToHtml(ast, args), behavior: readBehavior(containerId, meta.name) };
}

/**
 * A component is a slot-based container if it exposes an `items`/`plans` slot — the
 * reliable signal for "holds children". (usage_type "grid" is unreliable: leaf cards are
 * tagged "grid" to mean "shown in a grid".)
 */
export function isContainer(entry) {
  const slots = entry.slots || [];
  return slots.some((s) => s.name === "items" || s.name === "plans");
}

/** A leaf card can be dropped into a container: tagged usage "card" and isn't itself one. */
export function isCardLeaf(entry) {
  const usage = (entry.categorization && entry.categorization.usage_type) || [];
  return usage.includes("card") && !isContainer(entry);
}

/** Prefix a root-absolute app path with the deploy base (e.g. "/c/x" → "/repo/c/x"). */
export function rebase(p, base) {
  if (!base || base === "/") return p;
  const b = base.replace(/\/$/, "");
  return p.startsWith("/") ? b + p : p;
}

/** Rewrite root-absolute asset URLs (/stock/…, /screenshots/…) inside a rendered HTML string. */
export function rebaseHtml(html, base) {
  if (!base || base === "/" || !html) return html;
  const b = base.replace(/\/$/, "");
  return html
    .replace(/(["'(])\/(stock|screenshots)\//g, `$1${b}/$2/`);
}

export const THEMES = [
  { id: "simple", label: "Simple" },
  { id: "futuristic", label: "Futuristic" },
  { id: "classic", label: "Classic" },
  { id: "smooth", label: "Smooth" },
];

// Preview display order: widest → narrowest.
export const BREAKPOINTS = ["desktop", "small", "tablet", "mobile"];

/** Screenshots for one theme, ordered desktop → mobile. */
export function orderedShots(screenshots, theme) {
  const bps = (screenshots && screenshots[theme]) || {};
  return BREAKPOINTS.filter((bp) => bps[bp]).map((bp) => ({ bp, src: bps[bp] }));
}

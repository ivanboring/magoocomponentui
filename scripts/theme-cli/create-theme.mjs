import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { parseFlags } from "./search.mjs";
import { buildFilesFor } from "./build.mjs";
import { configFilesFor } from "./config.mjs";
import { fieldName } from "../../packages/generator/src/emit/drupal-config.js";

const SKELETON = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../skills/drupal-theme/skeleton");

/** Replace __KEY__ tokens; leave unknown tokens untouched. */
export function substitute(text, vars) {
  return text.replace(/__([A-Z_]+)__/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Remap a generator rel path to its place inside a Drupal theme. */
export function themePath(rel) {
  if (rel.startsWith("sdc/")) return "components/" + rel.slice(4);
  if (rel.startsWith("code-component/") || rel.startsWith("react/") || rel.startsWith("vue/")) return "components/" + rel.slice(rel.indexOf("/") + 1);
  if (rel.startsWith("drupal/config/")) return "config/install/" + rel.slice("drupal/config/".length);
  if (/^drupal\/(paragraph|node|field)--/.test(rel)) return "templates/" + rel.slice("drupal/".length);
  return rel;
}

/* ----------------------------- color helpers ----------------------------- */
/** @param {string} hex @returns {number[]|null} */
export function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function toHex(rgb) {
  return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
/** Relative luminance (0 dark … 1 light). Non-hex colors are treated as light. */
export function relLuminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function isDarkColor(hex) { return relLuminance(hex) < 0.5; }
/** Mix `hex` toward `target` by amount (0..1). */
function mix(hex, target, amt) {
  const a = parseHex(hex), b = parseHex(target);
  if (!a || !b) return hex;
  return toHex(a.map((v, i) => v + (b[i] - v) * amt));
}

/**
 * Full token palette. The five brand colors come from answers; the rest derive sensible
 * values from whether the background is dark (so black/dark themes don't keep light-theme
 * defaults). Any of the derived tokens can be overridden in `answers.colors`.
 */
export function themeTokens(ans) {
  const c = ans.colors || {};
  const dark = isDarkColor(c.background || "#ffffff");
  const surface = c.surface || c.background || "#ffffff";
  return {
    COLOR_ON_BACKGROUND: c.on_background || (dark ? "#f1f5f9" : "#0f172a"),
    COLOR_SURFACE_RAISED: c.surface_raised || (dark ? mix(surface, "#ffffff", 0.08) : "#f8fafc"),
    COLOR_ON_SURFACE_MUTED: c.on_surface_muted || (dark ? "#94a3b8" : "#64748b"),
    COLOR_SECONDARY: c.secondary || (dark ? "#e2e8f0" : "#0f172a"),
    COLOR_SECONDARY_CONTRAST: c.secondary_contrast || (dark ? "#0f172a" : "#ffffff"),
    COLOR_ACCENT: c.accent || c.primary,
    COLOR_ACCENT_CONTRAST: c.accent_contrast || c.primary_contrast,
    COLOR_BORDER: c.border || (dark ? "rgba(255, 255, 255, 0.14)" : "#e2e8f0"),
    SHADOW_RGB: c.shadow_rgb || (dark ? "0, 0, 0" : "15, 23, 42"),
  };
}

/* --------------------------------- helpers -------------------------------- */
function titleCase(s) {
  return String(s).replace(/[-_]/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}
const machine = (s) => String(s).replace(/-/g, "_");

async function copyTree(from, to, vars) {
  for (const e of await readdir(from, { withFileTypes: true })) {
    if (e.name === "olivero-regions.yml") continue; // appended to info.yml, not copied verbatim
    const src = path.join(from, e.name);
    const dest = path.join(to, e.name.replace(/__MACHINE__/g, vars.MACHINE));
    if (e.isDirectory()) { await mkdir(dest, { recursive: true }); await copyTree(src, dest, vars); }
    else {
      const raw = await readFile(src, "utf8");
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, substitute(raw, vars));
    }
  }
}

/** Write a generator {relPath: contents} map, remapping paths into the theme layout. */
async function writeMap(themeDir, map) {
  for (const [rel, contents] of Object.entries(map)) {
    const dest = path.join(themeDir, themePath(rel));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }
}

/** Write a {theme-relative-path: contents} map verbatim. */
async function writeThemeFiles(themeDir, map) {
  for (const [rel, contents] of Object.entries(map)) {
    const dest = path.join(themeDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }
}

/** Union the `dependencies.module` of every YAML config in a map into `set`. */
function collectModuleDeps(map, set) {
  for (const [rel, contents] of Object.entries(map)) {
    if (!rel.endsWith(".yml")) continue;
    try {
      const obj = yaml.load(contents);
      for (const m of (obj && obj.dependencies && obj.dependencies.module) || []) set.add(m);
    } catch { /* twig/non-yaml — ignore */ }
  }
}

/** Extract the paragraph bundle machine names present in a config map. */
function bundlesIn(map) {
  const out = [];
  for (const rel of Object.keys(map)) {
    const m = /paragraphs\.paragraphs_type\.([a-z0-9_]+)\.yml$/.exec(rel);
    if (m) out.push(m[1]);
  }
  return out;
}

/**
 * Optional host content type: a node bundle with an entity_reference_revisions field that
 * targets every generated paragraph bundle, so an editor can build a page by stacking the
 * components. Also ships a field template that spaces the stacked components with the
 * --space-section token and renders them wrapperless.
 * @param {{machine:string,name?:string,description?:string}} host @param {string[]} bundles
 */
export function hostContentTypeConfig(host, bundles) {
  const type = machine(host.machine);
  const name = host.name || titleCase(type);
  const field = fieldName("components", type);
  const dump = (o) => yaml.dump(o, { lineWidth: 120, noRefs: true, sortKeys: false });

  const targetBundles = {};
  const dragDrop = {};
  bundles.forEach((b, i) => { targetBundles[b] = b; dragDrop[b] = { weight: i, enabled: true }; });

  const files = {};
  files[`config/install/node.type.${type}.yml`] = dump({
    langcode: "en", status: true, dependencies: {}, name, type,
    description: host.description || "Landing page assembled from Magoo components.",
    help: "", new_revision: true, preview_mode: 1, display_submitted: false,
  });
  files[`config/install/field.storage.node.${field}.yml`] = dump({
    langcode: "en", status: true, dependencies: { module: ["entity_reference_revisions", "node", "paragraphs"] },
    id: `node.${field}`, field_name: field, entity_type: "node", type: "entity_reference_revisions",
    settings: { target_type: "paragraph" }, module: "entity_reference_revisions", locked: false,
    cardinality: -1, translatable: true, indexes: {}, persist_with_no_fields: false, custom_storage: false,
  });
  files[`config/install/field.field.node.${type}.${field}.yml`] = dump({
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.node.${field}`, `node.type.${type}`], module: ["entity_reference_revisions", "paragraphs"] },
    id: `node.${type}.${field}`, field_name: field, entity_type: "node", bundle: type,
    label: "Components", description: "Build the page by stacking Magoo components.", required: false,
    translatable: false, default_value: [], default_value_callback: "",
    settings: { handler: "default:paragraph", handler_settings: { negate: 0, target_bundles: targetBundles, target_bundles_drag_drop: dragDrop } },
    field_type: "entity_reference_revisions",
  });
  files[`config/install/core.entity_form_display.node.${type}.default.yml`] = dump({
    langcode: "en", status: true,
    dependencies: { config: [`field.field.node.${type}.${field}`, `node.type.${type}`], module: ["paragraphs"] },
    id: `node.${type}.default`, targetEntityType: "node", bundle: type, mode: "default",
    content: { [field]: { type: "paragraphs", weight: 0, region: "content", settings: {}, third_party_settings: {} } }, hidden: {},
  });
  files[`config/install/core.entity_view_display.node.${type}.default.yml`] = dump({
    langcode: "en", status: true,
    dependencies: { config: [`field.field.node.${type}.${field}`, `node.type.${type}`], module: ["entity_reference_revisions"] },
    id: `node.${type}.default`, targetEntityType: "node", bundle: type, mode: "default",
    content: { [field]: { type: "entity_reference_revisions_entity_view", label: "hidden", settings: { view_mode: "default", link: false }, weight: 0, region: "content", third_party_settings: {} } },
    hidden: {},
  });

  const tpl = `field--${field.replace(/_/g, "-")}.html.twig`;
  const template = `{#
  Stacks the page's Magoo components with a consistent gap (the --space-section design
  token). Items render wrapperless so a component's own grid/flex layout isn't broken by
  Drupal's field-item <div> wrappers.
#}
<div{{ attributes.addClass('landing-components') }} style="display: flex; flex-direction: column; gap: var(--space-section);">
  {% for item in items %}
    {{ item.content }}
  {% endfor %}
</div>
`;
  return { files, templates: { [`templates/${tpl}`]: template } };
}

export async function runCreateTheme(argv) {
  const f = parseFlags(argv);
  if (!f.answers) throw new Error("create-theme: pass --answers <file.json>");
  const ans = JSON.parse(await readFile(f.answers, "utf8"));
  const themeDir = f.out || path.join(".", ans.machine_name);
  const vars = {
    MACHINE: ans.machine_name, NAME: ans.name, DESCRIPTION: ans.description || "",
    COLOR_PRIMARY: ans.colors.primary, COLOR_PRIMARY_CONTRAST: ans.colors.primary_contrast,
    COLOR_BACKGROUND: ans.colors.background, COLOR_SURFACE: ans.colors.surface, COLOR_ON_SURFACE: ans.colors.on_surface,
    FONT_HEADING: ans.fonts.heading, FONT_BODY: ans.fonts.body, RADIUS_CARD: ans.radius.card,
    CONTENT_MAXWIDTH: ans.content_max_width || "max-w-6xl",
    ...themeTokens(ans),
  };
  await mkdir(themeDir, { recursive: true });
  await copyTree(SKELETON, themeDir, vars);

  // Append regions to the .info.yml (default: Olivero).
  const regionsFile = !ans.regions || ans.regions === "olivero" ? path.join(SKELETON, "olivero-regions.yml") : ans.regions;
  const regions = await readFile(regionsFile, "utf8");
  const infoPath = path.join(themeDir, `${ans.machine_name}.info.yml`);

  // Build + config each requested component into the theme, collecting the contrib module
  // deps and paragraph bundles the config needs.
  const target = ans.target || "sdc";
  const moduleDeps = new Set();
  const bundles = [];
  for (const c of ans.components || []) {
    await writeMap(themeDir, await buildFilesFor(c.id, target));
    if (c.config === "node") {
      // Simple site-templating: a node bundle + node--<name>.html.twig (no paragraphs).
      const map = await configFilesFor(c.id, { as: "node", theme: ans.machine_name });
      await writeMap(themeDir, map); collectModuleDeps(map, moduleDeps);
    } else if (c.config === "custom-field") {
      const map = await configFilesFor(c.id, { as: "custom-field", entity: c.entity, bundle: c.bundle });
      await writeMap(themeDir, map); collectModuleDeps(map, moduleDeps);
    } else if (c.config === "paragraph") {
      const map = await configFilesFor(c.id, { as: "paragraph", theme: ans.machine_name });
      await writeMap(themeDir, map); collectModuleDeps(map, moduleDeps); bundles.push(...bundlesIn(map));
    }
  }

  // Optional host content type that exposes every generated bundle as a page builder.
  if (ans.host_content_type && bundles.length) {
    const { files, templates } = hostContentTypeConfig(ans.host_content_type, bundles);
    await writeThemeFiles(themeDir, files); collectModuleDeps(files, moduleDeps);
    await writeThemeFiles(themeDir, templates);
  }

  // Append regions, then the collected module dependencies, to the .info.yml.
  let info = (await readFile(infoPath, "utf8")) + "\n" + regions;
  if (moduleDeps.size) {
    info += "\n# Modules the imported config requires — enable them before installing the theme.\n";
    info += "dependencies:\n" + [...moduleDeps].sort().map((m) => `  - ${m}`).join("\n") + "\n";
  }
  await writeFile(infoPath, info);

  process.stderr.write(`Theme scaffolded → ${themeDir}\n`);
}

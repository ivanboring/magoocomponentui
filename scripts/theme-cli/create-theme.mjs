import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFlags } from "./search.mjs";
import { buildFilesFor } from "./build.mjs";
import { configFilesFor } from "./config.mjs";

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
  if (rel.startsWith("drupal/paragraph--")) return "templates/" + rel.slice("drupal/".length);
  return rel;
}

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

async function writeMap(themeDir, map) {
  for (const [rel, contents] of Object.entries(map)) {
    const dest = path.join(themeDir, themePath(rel));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }
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
  };
  await mkdir(themeDir, { recursive: true });
  await copyTree(SKELETON, themeDir, vars);

  // Append regions to the .info.yml (default: Olivero).
  const regionsFile = !ans.regions || ans.regions === "olivero" ? path.join(SKELETON, "olivero-regions.yml") : ans.regions;
  const regions = await readFile(regionsFile, "utf8");
  const infoPath = path.join(themeDir, `${ans.machine_name}.info.yml`);
  await writeFile(infoPath, (await readFile(infoPath, "utf8")) + "\n" + regions);

  // Build + config each requested component into the theme.
  const target = ans.target || "sdc";
  for (const c of ans.components || []) {
    await writeMap(themeDir, await buildFilesFor(c.id, target));
    if (c.config === "custom-field") await writeMap(themeDir, await configFilesFor(c.id, { as: "custom-field", entity: c.entity, bundle: c.bundle }));
    else if (c.config === "paragraph") await writeMap(themeDir, await configFilesFor(c.id, { as: "paragraph" }));
  }
  process.stderr.write(`Theme scaffolded → ${themeDir}\n`);
}

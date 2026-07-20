// scripts/theme-cli/create-child.mjs
/** Generate a child theme of magoo_agentic_base_theme from an answers JSON. */
import { readFile, mkdir, writeFile, cp, stat } from "node:fs/promises";
import path from "node:path";
import { parseFlags } from "./search.mjs";
import { buildFilesFor } from "./build.mjs";
import { configFilesFor, loadComponentDef } from "./config.mjs";
import {
  applyPropDefaults, bundlesIn, collectModuleDeps, hostContentTypeConfig, machineName,
  writeMap, writeThemeFiles, yamlStr,
} from "./create-theme.mjs";
import { splitModuleDeps } from "../../packages/generator/src/emit/drupal-config.js";
import { canvasEligibility } from "../../packages/generator/src/canvas.js";
import { loadManifest, settingsFromTokens, settingsYaml, BASE_MACHINE, BASE_THEME_DIR } from "./tokens.mjs";
import { installBaseTheme } from "./install-base.mjs";
import { childSkillMd, childClaudeMd } from "./child-skill.mjs";
import { schemaYaml } from "../../skills/drupal-theme/base-theme/scripts/generate-schema.mjs";

const BOOTSTRAP = path.join(BASE_THEME_DIR, "../bin"); // skills/drupal-theme/bin — the existing magoo bootstrap

/**
 * The non-component files of a child theme. Pure — unit-testable without disk.
 * @param {any} ans answers JSON
 * @param {any} manifest token manifest
 * @returns {Record<string,string>} theme-relative path -> contents
 */
export function childFiles(ans, manifest) {
  const machine = machineName(ans.machine_name);
  /** @type {Record<string,string>} */
  const files = {};

  files[`${machine}.info.yml`] =
    `name: ${yamlStr(ans.name)}\n` +
    `type: theme\n` +
    `base theme: ${BASE_MACHINE}\n` +
    `core_version_requirement: ^11\n` +
    `description: ${yamlStr(ans.description || "")}\n` +
    `libraries:\n  - ${machine}/global\n`;

  // The base library MUST be a declared dependency: Drupal renders a library's dependencies
  // before the library itself, so magoo_agentic_base_theme/base.css (an unlayered Tailwind build that
  // also emits plain utilities like .grid-cols-1) lands BEFORE the child's styles.css. Without it
  // the base sheet is aggregated last and its unlayered utilities beat the child's responsive
  // variants (.sm\:grid-cols-2 …), collapsing every responsive grid in every component.
  files[`${machine}.libraries.yml`] =
    `global:\n  css:\n    theme:\n      css/dist/styles.css: {}\n  dependencies:\n    - magoo_agentic_base_theme/global\n`;

  files[`config/install/${machine}.settings.yml`] = settingsYaml(machine, settingsFromTokens(manifest, ans.tokens || {}));

  // Drupal needs a schema for the child's own magoo_* settings — it does not inherit the base's.
  files[`config/schema/${machine}.schema.yml`] = schemaYaml(machine, ans.name, manifest);

  // safelist.css is imported HERE and nowhere else: the dynamic grid/column classes the
  // components compose from props are only ever rendered by this theme, and emitting them from
  // the base sheet too would put unconditional `.grid-cols-N` rules in the same utilities layer
  // as this sheet's `.sm\:grid-cols-2` (equal specificity → last sheet wins → broken responsive
  // grids).
  files["css/src/styles.css"] =
    `/*\n` +
    ` * Tailwind entry for ${machine}. Scans the base theme's templates and this theme's own\n` +
    ` * components + templates, so only the utility classes actually in use are emitted.\n` +
    ` * Imports the shared token contract and the dynamic-class safelist from the base theme.\n` +
    ` * Re-run \`npm run build:css\` after adding a component.\n` +
    ` */\n` +
    `@import "tailwindcss";\n` +
    `@import "../../../${BASE_MACHINE}/css/src/contract.css";\n` +
    `@import "../../../${BASE_MACHINE}/css/src/safelist.css";\n` +
    `@source "../../../${BASE_MACHINE}/templates";\n` +
    `@source "../../components";\n` +
    `@source "../../templates";\n`;

  files["package.json"] = JSON.stringify({
    name: machine,
    private: true,
    scripts: {
      "build:css": "npx @tailwindcss/cli -i ./css/src/styles.css -o ./css/dist/styles.css --minify",
      dev: "npx @tailwindcss/cli -i ./css/src/styles.css -o ./css/dist/styles.css --watch",
    },
    devDependencies: { "@tailwindcss/cli": "^4.0.0", tailwindcss: "^4.0.0" },
  }, null, 2) + "\n";

  files[".claude/skills/magoo-components/SKILL.md"] = childSkillMd(machine, ans.name);
  files["CLAUDE.md"] = childClaudeMd(machine, ans.name);

  return files;
}

/** @param {string} p */
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

/** @param {string[]} argv */
export async function runCreateChild(argv) {
  const f = parseFlags(argv);
  if (!f.answers) {
    throw new Error(
      "create-child: pass --answers <file.json> [--themes-dir <web/themes/custom>]\n" +
      "  --themes-dir is the Drupal THEMES directory (the child and, if missing, the base theme are\n" +
      "  created inside it as <themes-dir>/<machine_name>). `--out` is accepted as an alias.",
    );
  }
  const ans = JSON.parse(await readFile(String(f.answers), "utf8"));
  if (!ans.machine_name || !ans.name) throw new Error("create-child: answers need machine_name and name");
  const machine = machineName(ans.machine_name);
  ans.machine_name = machine;

  // NOTE: for create-child this is the *themes* directory (e.g. web/themes/custom), NOT the theme
  // directory — unlike create-theme's --out. `--out` stays supported as an alias.
  const themesDir = String(f["themes-dir"] || f.out || ".");
  const themeDir = path.join(themesDir, machine);
  const manifest = await loadManifest();

  // The child is useless without its base — install it if the site doesn't have it yet.
  if (!(await exists(path.join(themesDir, BASE_MACHINE)))) {
    await installBaseTheme(themesDir);
    process.stderr.write(`Base theme installed → ${path.join(themesDir, BASE_MACHINE)}\n`);
  }

  await mkdir(themeDir, { recursive: true });
  await writeThemeFiles(themeDir, childFiles(ans, manifest));

  // Vendor the `magoo` bootstrap next to the skill so the theme is self-contained. Its unit
  // tests are dev-only — they have no business inside a production Drupal theme.
  await cp(BOOTSTRAP, path.join(themeDir, ".claude/skills/magoo-components/bin"), {
    recursive: true,
    filter: (src) => !src.endsWith(".test.mjs"),
  });

  const moduleDeps = new Set();
  const bundles = [];
  /** @type {Array<{id:string, reasons:string[]}>} */
  const canvasFallbacks = [];
  /** @type {string[]} */
  const canvasComponents = [];
  for (const c of ans.components || []) {
    let mode = c.config || "paragraph";
    let canvasMode = false;

    if (mode === "canvas") {
      // Canvas auto-discovers the SDC and derives its own `canvas.component.sdc.*` config on cache
      // rebuild — but only if every prop shape maps to a Drupal field. An ineligible component would
      // ship an SDC that never shows up in the Library, so fall back to the wiring that does work.
      const { eligible, reasons } = canvasEligibility(await loadComponentDef(c.id));
      if (eligible) {
        canvasMode = true;
      } else {
        mode = "paragraph";
        canvasFallbacks.push({ id: c.id, reasons });
        process.stderr.write(
          `WARNING: ${c.id} was requested as config: "canvas" but is NOT Canvas-eligible:\n` +
          reasons.map((r) => `  - ${r}\n`).join("") +
          `  → falling back to config: "paragraph" for ${c.id}.\n`,
        );
      }
    }

    // Every mode installs the SDC; only the *wiring to content* differs. A Canvas-wired component
    // gets the media-entity ($ref) flavor so images/videos are media-library pickers; a
    // paragraph/node/custom-field component gets the plain URL-string flavor its fields feed.
    await writeMap(themeDir, await buildFilesFor(c.id, "sdc", { canvas: canvasMode }));

    if (canvasMode) {
      moduleDeps.add("canvas");
      canvasComponents.push(c.id);
      continue; // Canvas mode emits the SDC and NOTHING else.
    }

    const opts = mode === "custom-field"
      ? { as: "custom-field", entity: c.entity, bundle: c.bundle }
      : { as: mode, theme: machine };
    const map = await configFilesFor(c.id, opts);
    if (c.props) applyPropDefaults(map, await loadComponentDef(c.id), c.props);
    await writeMap(themeDir, map);
    collectModuleDeps(map, moduleDeps);
    if (mode === "paragraph") bundles.push(...bundlesIn(map));
  }

  if (ans.host_content_type && bundles.length) {
    const { files, templates } = hostContentTypeConfig(ans.host_content_type, bundles);
    await writeThemeFiles(themeDir, { ...files, ...templates });
    collectModuleDeps(files, moduleDeps);
  }

  if (moduleDeps.size) {
    const infoPath = path.join(themeDir, `${machine}.info.yml`);
    let info = await readFile(infoPath, "utf8");
    info += "\n# Modules the imported config requires — enable them before installing the theme.\ndependencies:\n"
      + [...moduleDeps].sort().map((m) => `  - ${m}`).join("\n") + "\n";
    await writeFile(infoPath, info);
  }

  // Core modules ship with Drupal — they are enabled with drush, never required with composer
  // (there is no drupal/link, drupal/media_library, … package on Packagist). The classification
  // lives with the field-type registry (drupal-config.js), which is what produces these deps in
  // the first place — never duplicate it here.
  const { contrib: contribDeps } = splitModuleDeps(moduleDeps);

  const canvasSummary =
    (canvasComponents.length
      ? `Canvas components (SDC only — Canvas derives its config on \`drush cr\`, no paragraph type):\n` +
        canvasComponents.map((id) => `  - ${id}\n`).join("")
      : "") +
    (canvasFallbacks.length
      ? `Requested as Canvas but NOT Canvas-eligible → emitted as PARAGRAPH instead:\n` +
        canvasFallbacks.map((f) => `  - ${f.id}: ${f.reasons.join(" ")}\n`).join("")
      : "");

  // build:css MUST come before theme:enable — the child's global library links
  // css/dist/styles.css, which does not exist until Tailwind has run.
  process.stderr.write(
    `Child theme scaffolded → ${themeDir}\n` +
    canvasSummary +
    `Next:\n` +
    `  ddev composer require ${contribDeps.map((m) => "drupal/" + m).join(" ") || "(no contrib modules)"}\n` +
    `  ddev drush en ${[...moduleDeps].join(" ")} -y\n` +
    `  ddev npm install --prefix ${themeDir} && ddev npm run build:css --prefix ${themeDir}   # required BEFORE enabling\n` +
    `  ddev drush theme:enable ${machine} -y && ddev drush config:set system.theme default ${machine} -y\n` +
    `  ddev drush cim --partial --source=${themeDir}/config/install -y && ddev drush cr\n`
  );
}

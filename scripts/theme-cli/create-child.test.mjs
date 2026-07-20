import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { loadManifest } from "./tokens.mjs";
import { childFiles, runCreateChild } from "./create-child.mjs";

const ANSWERS = {
  machine_name: "acme_child",
  name: "Acme Child",
  description: "Test child.",
  tokens: { color_primary: "#0447ff", radius_card: "20px" },
};

test("childFiles writes an info.yml that subthemes the base", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const info = files["acme_child.info.yml"];
  assert.match(info, /base theme: magoo_agentic_base_theme/);
  assert.match(info, /core_version_requirement: \^11/);
  assert.doesNotMatch(info, /^regions:/m); // regions are inherited from the base
});

test("childFiles writes settings.yml carrying the token overrides on top of the defaults", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const settings = files["config/install/acme_child.settings.yml"];
  assert.match(settings, /magoo_color_primary: '#0447ff'/);
  assert.match(settings, /magoo_radius_card: 20px/);
  assert.match(settings, /magoo_color_success: '#16a34a'/); // untouched default still present
});

test("childFiles writes a Tailwind entry that sources the base templates and its own components", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const css = files["css/src/styles.css"];
  assert.match(css, /@import "tailwindcss"/);
  assert.match(css, /@import "\.\.\/\.\.\/\.\.\/magoo_agentic_base_theme\/css\/src\/contract\.css"/);
  // The dynamic-class safelist (grid-cols-N …) is imported by the CHILD only — if the base sheet
  // emitted those utilities too they would beat the child's responsive variants at equal specificity.
  assert.match(css, /@import "\.\.\/\.\.\/\.\.\/magoo_agentic_base_theme\/css\/src\/safelist\.css"/);
  assert.match(css, /@source "\.\.\/\.\.\/\.\.\/magoo_agentic_base_theme\/templates"/);
  assert.match(css, /@source "\.\.\/\.\.\/components"/);
});

test("childFiles vendors the component skill and a CLAUDE.md into the theme", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  assert.ok(files[".claude/skills/magoo-components/SKILL.md"].includes("magoo search"));
  assert.match(files["CLAUDE.md"], /magoo-components/);
  assert.match(files["CLAUDE.md"], /npm run build:css/);
});

test("childFiles package.json builds the child's own CSS", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const pkg = JSON.parse(files["package.json"]);
  assert.equal(pkg.name, "acme_child");
  assert.match(pkg.scripts["build:css"], /-i \.\/css\/src\/styles\.css -o \.\/css\/dist\/styles\.css/);
});

test("childFiles ships a config schema for the child's own magoo_* settings", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const schema = files["config/schema/acme_child.schema.yml"];
  assert.match(schema, /^acme_child\.settings:/m);
  assert.match(schema, /^ {2}type: theme_settings$/m);
  assert.match(schema, /^ {4}magoo_color_primary:$/m);
  assert.match(schema, /^ {4}magoo_color_primary_dark:$/m); // colors get a dark counterpart
  assert.match(schema, /^ {4}magoo_sticky_header:\n {6}type: boolean$/m); // checkbox -> boolean
});

test("the vendored skill forbids override CSS and forking a component's Twig", async () => {
  const files = childFiles(ANSWERS, await loadManifest());
  const skill = files[".claude/skills/magoo-components/SKILL.md"];
  assert.match(skill, /Do NOT write CSS and do NOT fork a component's Twig/);
});

test("childFiles rejects an invalid Drupal machine name", async () => {
  const manifest = await loadManifest();
  assert.throws(() => childFiles({ ...ANSWERS, machine_name: "Acme Child!" }, manifest), /machine name/i);
});

test("childFiles quotes the theme name so a colon in it can't break the info.yml", async () => {
  const files = childFiles({ ...ANSWERS, name: "Acme: The Child" }, await loadManifest());
  const info = files["acme_child.info.yml"];
  assert.match(info, /^name: 'Acme: The Child'$/m);
  assert.doesNotThrow(() => yaml.load(info));
});

/* -------------------------- runCreateChild (end to end) -------------------------- */

/** Scaffold a child into a scratch themes dir. @param {any} extra answers overrides */
async function scaffold(extra = {}) {
  const themesDir = await mkdtemp(path.join(tmpdir(), "magoo-child-"));
  const answersFile = path.join(themesDir, "answers.json");
  await writeFile(answersFile, JSON.stringify({
    machine_name: "acme_child", name: "Acme Child", description: "Test child.",
    tokens: { color_primary: "#0447ff" },
    components: [{ id: "dashboard/stat-card", config: "paragraph" }],
    ...extra,
  }));
  await runCreateChild(["--answers", answersFile, "--themes-dir", themesDir]);
  return { themesDir, themeDir: path.join(themesDir, "acme_child") };
}

test("runCreateChild scaffolds a working child theme from a real catalog component", async () => {
  const { themesDir, themeDir } = await scaffold();
  try {
    // (a) the component's config module deps land in the info.yml
    const info = yaml.load(await readFile(path.join(themeDir, "acme_child.info.yml"), "utf8"));
    assert.equal(info["base theme"], "magoo_agentic_base_theme");
    assert.ok(info.dependencies.includes("paragraphs"), "paragraphs dep collected");
    assert.ok(info.dependencies.includes("options"), "options dep (enum prop -> list_string) collected");

    // (b) the paragraph twig embeds THIS theme's component, not the your_theme placeholder
    const twig = await readFile(path.join(themeDir, "templates/paragraph--stat-card.html.twig"), "utf8");
    assert.match(twig, /acme_child:stat-card/);
    assert.doesNotMatch(twig, /your_theme/);

    // (c) + (d) the SDC and the child's own settings schema exist
    await access(path.join(themeDir, "components/stat-card/stat-card.component.yml"));
    await access(path.join(themeDir, "config/schema/acme_child.schema.yml"));

    // the base theme is installed alongside the child, without the bin/ test files
    await access(path.join(themesDir, "magoo_agentic_base_theme/magoo_agentic_base_theme.info.yml"));
    await assert.rejects(access(path.join(themeDir, ".claude/skills/magoo-components/bin/cache.test.mjs")));
    await access(path.join(themeDir, ".claude/skills/magoo-components/bin/magoo"));

    // the installed settings are schema-valid: a checkbox setting is a real boolean
    const settings = yaml.load(await readFile(path.join(themeDir, "config/install/acme_child.settings.yml"), "utf8"));
    assert.equal(settings.magoo_sticky_header, false);
    assert.equal(settings.magoo_color_primary, "#0447ff");
  } finally {
    await rm(themesDir, { recursive: true, force: true });
  }
});

test("runCreateChild applies components[].props as the field's default_value", async () => {
  const { themesDir, themeDir } = await scaffold({
    components: [{ id: "dashboard/stat-card", config: "paragraph", props: { trend: "up", label: "Revenue" } }],
  });
  try {
    const field = yaml.load(await readFile(
      path.join(themeDir, "config/install/field.field.paragraph.stat_card.field_stat_card_trend.yml"), "utf8"));
    assert.deepEqual(field.default_value, [{ value: "up" }]);
    const label = yaml.load(await readFile(
      path.join(themeDir, "config/install/field.field.paragraph.stat_card.field_stat_card_label.yml"), "utf8"));
    assert.deepEqual(label.default_value, [{ value: "Revenue" }]);
  } finally {
    await rm(themesDir, { recursive: true, force: true });
  }
});

test('config: "canvas" emits ONLY the SDC and adds the canvas module dep', async () => {
  const { themesDir, themeDir } = await scaffold({
    components: [{ id: "dashboard/stat-card", config: "canvas" }],
  });
  try {
    // The SDC is installed — Canvas auto-discovers it and derives its own config on `drush cr`.
    await access(path.join(themeDir, "components/stat-card/stat-card.component.yml"));
    // …and NOTHING else: no paragraph type, no fields, no paragraph twig.
    await assert.rejects(access(path.join(themeDir, "templates/paragraph--stat-card.html.twig")));
    await assert.rejects(access(
      path.join(themeDir, "config/install/paragraphs.paragraphs_type.stat_card.yml")));
    await assert.rejects(access(
      path.join(themeDir, "config/install/field.field.paragraph.stat_card.field_stat_card_label.yml")));

    const info = yaml.load(await readFile(path.join(themeDir, "acme_child.info.yml"), "utf8"));
    assert.deepEqual(info.dependencies, ["canvas"]);
  } finally {
    await rm(themesDir, { recursive: true, force: true });
  }
});

test('config: "canvas" on an INELIGIBLE component falls back to paragraph mode', async () => {
  const { themesDir, themeDir } = await scaffold({
    // feature-grid's `items` is an array of objects — Canvas can't store it.
    components: [
      { id: "marketing/feature-grid", config: "canvas" },
      { id: "dashboard/stat-card", config: "canvas" },
    ],
  });
  try {
    // Fell back: the paragraph bundle + twig exist for feature-grid.
    await access(path.join(themeDir, "templates/paragraph--feature-grid.html.twig"));
    await access(path.join(themeDir, "config/install/paragraphs.paragraphs_type.feature_grid.yml"));
    await access(path.join(themeDir, "components/feature-grid/feature-grid.component.yml"));
    // The eligible one stayed Canvas-only.
    await assert.rejects(access(path.join(themeDir, "templates/paragraph--stat-card.html.twig")));

    // Modes mix: both the canvas dep and the paragraph stack are declared.
    const info = yaml.load(await readFile(path.join(themeDir, "acme_child.info.yml"), "utf8"));
    assert.ok(info.dependencies.includes("canvas"));
    assert.ok(info.dependencies.includes("paragraphs"));
  } finally {
    await rm(themesDir, { recursive: true, force: true });
  }
});

test("the base theme's own Tailwind entry does not import the safelist", async () => {
  const base = await readFile(new URL("../../skills/drupal-theme/base-theme/css/src/base.css", import.meta.url), "utf8");
  assert.doesNotMatch(base, /safelist\.css/);
  const contract = await readFile(new URL("../../skills/drupal-theme/base-theme/css/src/contract.css", import.meta.url), "utf8");
  assert.doesNotMatch(contract, /@source inline/); // safelist moved out of the shared contract
  const safelist = await readFile(new URL("../../skills/drupal-theme/base-theme/css/src/safelist.css", import.meta.url), "utf8");
  for (const v of ["", "sm:", "md:", "lg:", "xl:"]) {
    assert.ok(safelist.includes(`@source inline("${v}grid-cols-`), `safelist covers ${v}grid-cols-*`);
  }
});

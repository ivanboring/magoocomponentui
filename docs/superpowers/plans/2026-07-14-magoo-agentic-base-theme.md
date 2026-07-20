# Magoo Agentic Base Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `magoo_agentic_base_theme` — a Drupal 11 base theme with ~22 regions and a full design-token settings form — plus a `create-child` generator that emits a styled child theme carrying its own agent skills, and a spec-kit skill that turns a design reference + a purpose into that child theme; then prove it end to end on `https://custom-theme.ddev.site/`.

**Architecture:** One **token manifest** (`tokens.manifest.json`) is the single source of truth for every design token: its CSS variable, group, type, light/dark default. PHP reads it to build the theme-settings form and to emit a runtime `:root { … }` block; JS (the generator) reads it to write a child theme's `settings.yml`. Because Tailwind v4 compiles `bg-primary` to `background-color: var(--color-primary)`, rewriting those variables at runtime restyles every component with no rebuild. The child theme still runs its own Tailwind build (scanning the base's templates + its own components) so only the classes in use are emitted.

**Tech Stack:** Drupal 11.4 / PHP 8.4 (in DDEV), Tailwind v4 (`@tailwindcss/cli`, run via `ddev npm`), Node 24 ESM + JSDoc, `node --test`, js-yaml, existing `packages/generator` + `scripts/theme-cli/`.

## Global Constraints

- **NO GIT OPERATIONS ANYWHERE IN THIS PLAN.** No `git init`, no `git add`, no `git commit`, no branches. The user will set up a git repo inside the base theme themselves. Each task ends with a verification gate instead of a commit.
- **Canonical source of the base theme is `skills/drupal-theme/base-theme/`** in this repo. The copy at `custom_theme/web/themes/custom/magoo_agentic_base_theme/` is a *deployment* produced by `magoo install-base`. Edit the canonical one, re-run install-base.
- Base theme machine name is fixed: `magoo_agentic_base_theme`.
- **Never rename or add a token variable per theme** — the contract in `packages/themes/tokens.contract.css` is fixed; only values differ (CLAUDE.md).
- ASCII hyphens only in YAML (`-` U+002D, never `−` U+2212).
- All Drupal/npm commands run through DDEV from `custom_theme/`: `ddev drush …`, `ddev npm …`, `ddev exec …`.
- Node tests live beside their source as `*.test.mjs` and are picked up by `pnpm test` (glob `scripts/**/*.test.mjs`, `skills/**/*.test.mjs`).
- Components are styled by **token values + variant/prop choices only** — no override CSS layer, no forked component Twig in child themes.

---

## File Structure

**New — canonical base theme (repo):** `skills/drupal-theme/base-theme/`

| File | Responsibility |
|---|---|
| `tokens.manifest.json` | THE source of truth: every token's key, CSS var, group, type, light default, dark default. |
| `magoo_agentic_base_theme.info.yml` | Theme metadata, ~22 regions, `settings:` defaults (inherited by children). |
| `magoo_agentic_base_theme.libraries.yml` | `global` library → `css/dist/base.css`, `js/color-scheme.js`. |
| `magoo_agentic_base_theme.theme` | `hook_preprocess_html` (emit `:root` vars + font link), region visibility, `hook_preprocess_page`. |
| `includes/tokens.php` | Manifest loader, settings→CSS-variable map, dark derivation, type-scale derivation. Pure functions. |
| `theme-settings.php` | Builds the whole form **by looping the manifest** — inherited by every child. |
| `templates/…` | `html.html.twig`, `page.html.twig`, `region.html.twig`, `block.html.twig`, `node.html.twig`, `field.html.twig`. |
| `css/src/contract.css` | Tailwind `@theme` contract + `@source inline(…)` safelist. Imported by a child's CSS entry. |
| `css/dist/base.css` | Prebuilt (base templates only) so the base is installable standalone. |
| `js/color-scheme.js` | Dark-mode toggle → `data-color-scheme` on `<html>`, persisted. |

**New — generator (repo):** `scripts/theme-cli/`

| File | Responsibility |
|---|---|
| `tokens.mjs` | Loads `tokens.manifest.json`; `defaultSettings()`, `settingsFromTokens(tokens)`, `settingsYaml(machine, settings)`. |
| `tokens.test.mjs` | Unit tests for the above. |
| `install-base.mjs` | `runInstallBase(argv)` — copy the canonical base theme into a themes dir. |
| `create-child.mjs` | `runCreateChild(argv)` — answers JSON → child theme (info/settings/package.json/CSS entry/components/config/vendored skills). |
| `create-child.test.mjs` | Unit tests: file set, deps, settings YAML, vendored skill presence. |
| `child-skill.mjs` | The vendored `.claude/skills/magoo-components/SKILL.md` + `CLAUDE.md` text for a child theme. |

**New — skills (repo):** `skills/drupal-theme-spec/SKILL.md` (the spec-kit questionnaire) + `references/design-reference.md` (how to ingest Refero / live site / image / description).

**Modified:** `scripts/theme-cli.mjs` (register `install-base`, `create-child`), `skills/drupal-theme/SKILL.md` (point at the new commands), `CLAUDE.md`, `.agents/progress.md`.

**Deployment (not edited by hand):** `custom_theme/web/themes/custom/magoo_agentic_base_theme/` and `custom_theme/web/themes/custom/<demo_child>/`.

---

### Task 1: Token manifest + JS loader

**Files:**
- Create: `skills/drupal-theme/base-theme/tokens.manifest.json`
- Create: `scripts/theme-cli/tokens.mjs`
- Test: `scripts/theme-cli/tokens.test.mjs`

**Interfaces:**
- Produces: `loadManifest(): Promise<Manifest>` where `Manifest = { groups: Group[] }`, `Group = { key, label, tokens: Token[] }`, `Token = { key, var, type, label, default, dark? , description? }`. `type` ∈ `"color" | "text" | "select" | "checkbox" | "number"`. Also `defaultSettings(manifest): Record<string,string>` (keys are setting names, e.g. `magoo_color_primary`), `settingsYaml(machine, settings): string`.
- Consumed by: Task 2 (PHP reads the same JSON), Task 4 (`create-child`).

**Setting-name rule (used by PHP and JS alike):** setting name = `magoo_` + token key. CSS variable = the token's `var` field. Dark variant setting = `magoo_<key>_dark`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/theme-cli/tokens.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadManifest, tokenList, defaultSettings, settingsFromTokens, settingsYaml } from "./tokens.mjs";

test("manifest covers every contract token group", async () => {
  const m = await loadManifest();
  const groups = m.groups.map((g) => g.key);
  for (const g of ["brand", "color", "typography", "shape", "elevation", "spacing", "motion", "layout", "advanced"]) {
    assert.ok(groups.includes(g), `missing group ${g}`);
  }
});

test("every token has a key, a css var, a type and a default", async () => {
  const m = await loadManifest();
  for (const t of tokenList(m)) {
    assert.match(t.key, /^[a-z0-9_]+$/, `bad key ${t.key}`);
    assert.ok(t.type, `${t.key} has no type`);
    assert.ok("default" in t, `${t.key} has no default`);
    if (t.var) assert.match(t.var, /^--[a-z-]+$/, `bad var ${t.var}`);
  }
});

test("color tokens carry a dark counterpart", async () => {
  const m = await loadManifest();
  const colors = tokenList(m).filter((t) => t.type === "color");
  assert.ok(colors.length >= 20, `expected >=20 colors, got ${colors.length}`);
  for (const t of colors) assert.ok("dark" in t, `${t.key} has no dark default`);
});

test("defaultSettings prefixes every key with magoo_ and adds _dark for colors", async () => {
  const m = await loadManifest();
  const s = defaultSettings(m);
  assert.equal(s.magoo_color_primary, "#4f46e5");
  assert.ok("magoo_color_primary_dark" in s);
  assert.equal(s.magoo_font_heading, '"Inter", ui-sans-serif, system-ui, sans-serif');
});

test("settingsFromTokens overrides only the tokens given", async () => {
  const m = await loadManifest();
  const s = settingsFromTokens(m, { color_primary: "#0447ff", font_heading: '"Waldenburg", sans-serif' });
  assert.equal(s.magoo_color_primary, "#0447ff");
  assert.equal(s.magoo_font_heading, '"Waldenburg", sans-serif');
  assert.equal(s.magoo_color_success, "#16a34a"); // untouched default
});

test("settingsYaml emits a Drupal theme settings file", async () => {
  const m = await loadManifest();
  const y = settingsYaml("acme_theme", settingsFromTokens(m, { color_primary: "#0447ff" }));
  assert.match(y, /magoo_color_primary: '#0447ff'/);
  assert.doesNotMatch(y, /machine/); // no stray keys
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
node --test scripts/theme-cli/tokens.test.mjs
```
Expected: FAIL — `Cannot find module './tokens.mjs'`.

- [ ] **Step 3: Write the manifest**

Create `skills/drupal-theme/base-theme/tokens.manifest.json`. Defaults are copied from `packages/themes/tokens.contract.css` (the "simple" values) so the base theme out of the box looks like the library's default theme. Dark defaults are the dark-aware counterparts.

```json
{
  "groups": [
    {
      "key": "brand",
      "label": "Brand",
      "description": "Set these five and press Save; every unset token below is derived from them.",
      "tokens": [
        { "key": "color_primary", "var": "--color-primary", "type": "color", "label": "Primary", "default": "#4f46e5", "dark": "#818cf8" },
        { "key": "color_primary_contrast", "var": "--color-primary-contrast", "type": "color", "label": "On primary", "default": "#ffffff", "dark": "#0f172a" },
        { "key": "color_background", "var": "--color-background", "type": "color", "label": "Background", "default": "#ffffff", "dark": "#0b1120" },
        { "key": "color_surface", "var": "--color-surface", "type": "color", "label": "Surface", "default": "#ffffff", "dark": "#111827" },
        { "key": "color_on_surface", "var": "--color-on-surface", "type": "color", "label": "On surface", "default": "#0f172a", "dark": "#e5e7eb" }
      ]
    },
    {
      "key": "color",
      "label": "Colors",
      "description": "Every color token. Leave a field empty to keep the derived value.",
      "tokens": [
        { "key": "color_on_background", "var": "--color-on-background", "type": "color", "label": "On background", "default": "#0f172a", "dark": "#e5e7eb" },
        { "key": "color_surface_raised", "var": "--color-surface-raised", "type": "color", "label": "Surface raised", "default": "#f8fafc", "dark": "#1f2937" },
        { "key": "color_on_surface_muted", "var": "--color-on-surface-muted", "type": "color", "label": "On surface (muted)", "default": "#64748b", "dark": "#9ca3af" },
        { "key": "color_secondary", "var": "--color-secondary", "type": "color", "label": "Secondary", "default": "#0f172a", "dark": "#e2e8f0" },
        { "key": "color_secondary_contrast", "var": "--color-secondary-contrast", "type": "color", "label": "On secondary", "default": "#ffffff", "dark": "#0f172a" },
        { "key": "color_accent", "var": "--color-accent", "type": "color", "label": "Accent", "default": "#6366f1", "dark": "#a5b4fc" },
        { "key": "color_accent_contrast", "var": "--color-accent-contrast", "type": "color", "label": "On accent", "default": "#ffffff", "dark": "#0f172a" },
        { "key": "color_border", "var": "--color-border", "type": "color", "label": "Border", "default": "#e2e8f0", "dark": "#374151" },
        { "key": "color_ring", "var": "--color-ring", "type": "color", "label": "Focus ring", "default": "#4f46e5", "dark": "#818cf8" },
        { "key": "color_success", "var": "--color-success", "type": "color", "label": "Success", "default": "#16a34a", "dark": "#4ade80" },
        { "key": "color_success_contrast", "var": "--color-success-contrast", "type": "color", "label": "On success", "default": "#ffffff", "dark": "#052e16" },
        { "key": "color_warning", "var": "--color-warning", "type": "color", "label": "Warning", "default": "#d97706", "dark": "#fbbf24" },
        { "key": "color_warning_contrast", "var": "--color-warning-contrast", "type": "color", "label": "On warning", "default": "#ffffff", "dark": "#451a03" },
        { "key": "color_danger", "var": "--color-danger", "type": "color", "label": "Danger", "default": "#dc2626", "dark": "#f87171" },
        { "key": "color_danger_contrast", "var": "--color-danger-contrast", "type": "color", "label": "On danger", "default": "#ffffff", "dark": "#450a0a" },
        { "key": "color_info", "var": "--color-info", "type": "color", "label": "Info", "default": "#2563eb", "dark": "#60a5fa" },
        { "key": "color_info_contrast", "var": "--color-info-contrast", "type": "color", "label": "On info", "default": "#ffffff", "dark": "#0b1120" }
      ]
    },
    {
      "key": "typography",
      "label": "Typography",
      "tokens": [
        { "key": "font_heading", "var": "--font-heading", "type": "text", "label": "Heading family", "default": "\"Inter\", ui-sans-serif, system-ui, sans-serif" },
        { "key": "font_body", "var": "--font-body", "type": "text", "label": "Body family", "default": "\"Inter\", ui-sans-serif, system-ui, sans-serif" },
        { "key": "font_mono", "var": "--font-mono", "type": "text", "label": "Mono family", "default": "\"JetBrains Mono\", ui-monospace, SFMono-Regular, monospace" },
        { "key": "weight_heading", "var": "--weight-heading", "type": "text", "label": "Heading weight", "default": "600" },
        { "key": "weight_body", "var": "--weight-body", "type": "text", "label": "Body weight", "default": "400" },
        { "key": "tracking_heading", "var": "--tracking-heading", "type": "text", "label": "Heading tracking", "default": "-0.01em" },
        { "key": "text_base", "var": "--text-base", "type": "text", "label": "Base font size", "default": "1rem", "description": "Root size of the type scale." },
        { "key": "scale_ratio", "var": null, "type": "select", "label": "Type scale ratio", "default": "1.25", "options": { "1.125": "Major second (1.125)", "1.2": "Minor third (1.2)", "1.25": "Major third (1.25)", "1.333": "Perfect fourth (1.333)", "1.414": "Augmented fourth (1.414)" }, "description": "Derives --text-sm … --text-5xl from the base size." },
        { "key": "font_source", "var": null, "type": "select", "label": "Web font source", "default": "none", "options": { "none": "None (system / self-hosted)", "google": "Google Fonts", "bunny": "Bunny Fonts (GDPR-friendly)" } },
        { "key": "font_url", "var": null, "type": "text", "label": "Web font stylesheet URL", "default": "", "description": "Full href, e.g. https://fonts.bunny.net/css?family=inter:400,600" }
      ]
    },
    {
      "key": "shape",
      "label": "Shape",
      "tokens": [
        { "key": "radius_control", "var": "--radius-control", "type": "text", "label": "Control radius", "default": "0.375rem" },
        { "key": "radius_button", "var": "--radius-button", "type": "text", "label": "Button radius", "default": "0.5rem" },
        { "key": "radius_card", "var": "--radius-card", "type": "text", "label": "Card radius", "default": "0.75rem" },
        { "key": "radius_pill", "var": "--radius-pill", "type": "text", "label": "Pill radius", "default": "9999px" }
      ]
    },
    {
      "key": "elevation",
      "label": "Elevation",
      "tokens": [
        { "key": "shadow_rgb", "var": null, "type": "text", "label": "Shadow tint (R, G, B)", "default": "15, 23, 42", "description": "Used to derive the three shadows when they are left at their default." },
        { "key": "shadow_card", "var": "--shadow-card", "type": "text", "label": "Card shadow", "default": "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)" },
        { "key": "shadow_raised", "var": "--shadow-raised", "type": "text", "label": "Raised shadow", "default": "0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.08)" },
        { "key": "shadow_focus", "var": "--shadow-focus", "type": "text", "label": "Focus shadow", "default": "0 0 0 3px rgba(15, 23, 42, 0.35)" }
      ]
    },
    {
      "key": "spacing",
      "label": "Spacing",
      "tokens": [
        { "key": "density", "var": "--spacing", "type": "select", "label": "Density", "default": "0.25rem", "options": { "0.2rem": "Compact", "0.25rem": "Comfortable (default)", "0.3rem": "Spacious" }, "description": "Tailwind's base spacing unit — p-4 is calc(var(--spacing) * 4), so this rescales EVERY component's padding, gap and margin." },
        { "key": "space_section", "var": "--space-section", "type": "text", "label": "Section spacing", "default": "4rem" },
        { "key": "space_card", "var": "--space-card", "type": "text", "label": "Card padding", "default": "1.5rem" },
        { "key": "space_control", "var": "--space-control", "type": "text", "label": "Control padding", "default": "0.75rem" },
        { "key": "container_max_width", "var": "--container-max", "type": "text", "label": "Container max width", "default": "72rem", "description": "Max width of the contained page regions." }
      ]
    },
    {
      "key": "motion",
      "label": "Motion",
      "tokens": [
        { "key": "duration_token", "var": "--duration-token", "type": "text", "label": "Transition duration", "default": "150ms" },
        { "key": "ease_token", "var": "--ease-token", "type": "text", "label": "Easing", "default": "cubic-bezier(0.4, 0, 0.2, 1)" }
      ]
    },
    {
      "key": "layout",
      "label": "Layout",
      "tokens": [
        { "key": "color_scheme", "var": null, "type": "select", "label": "Color scheme", "default": "light", "options": { "light": "Light only", "dark": "Dark only", "auto": "Follow the OS", "toggle": "Follow the OS + show a toggle" } },
        { "key": "sidebar_position", "var": null, "type": "select", "label": "Sidebar position", "default": "last", "options": { "first": "Before the content", "last": "After the content" } },
        { "key": "sticky_header", "var": null, "type": "checkbox", "label": "Sticky header", "default": "0" },
        { "key": "full_bleed_regions", "var": null, "type": "text", "label": "Full-bleed regions", "default": "header_top,header,primary_menu,secondary_menu,hero,hero_secondary,pre_footer,footer_top,footer_columns,footer_bottom", "description": "Comma-separated region keys rendered edge to edge. Every other region is centered in the container." },
        { "key": "hidden_regions", "var": null, "type": "text", "label": "Hidden regions", "default": "", "description": "Comma-separated region keys to never render." }
      ]
    },
    {
      "key": "advanced",
      "label": "Advanced",
      "tokens": [
        { "key": "custom_css_vars", "var": null, "type": "textarea", "label": "Extra CSS variables", "default": "", "description": "Raw declarations appended last inside :root, e.g. --color-primary: #ff0000;  They win over everything above." }
      ]
    }
  ]
}
```

- [ ] **Step 4: Write `tokens.mjs`**

```js
// scripts/theme-cli/tokens.mjs
/** Token manifest — the single source of truth shared by the PHP settings form and this generator. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const BASE_THEME_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../skills/drupal-theme/base-theme");
export const BASE_MACHINE = "magoo_agentic_base_theme";

/** @returns {Promise<{groups: Array<{key:string,label:string,tokens:any[]}>}>} */
export async function loadManifest() {
  return JSON.parse(await readFile(path.join(BASE_THEME_DIR, "tokens.manifest.json"), "utf8"));
}

/** Flatten the manifest to a single token array. */
export function tokenList(manifest) {
  return manifest.groups.flatMap((g) => g.tokens);
}

/** Drupal setting name for a token key. */
export const settingName = (key) => `magoo_${key}`;

/** Every setting at its default, including the `_dark` counterpart of each color. */
export function defaultSettings(manifest) {
  /** @type {Record<string,string>} */
  const out = {};
  for (const t of tokenList(manifest)) {
    out[settingName(t.key)] = String(t.default);
    if (t.type === "color") out[settingName(t.key) + "_dark"] = String(t.dark ?? t.default);
  }
  return out;
}

/**
 * Defaults with `tokens` applied over them.
 * @param {any} manifest
 * @param {Record<string,string>} tokens  token key (NOT setting name) -> value; `<key>_dark` also accepted
 */
export function settingsFromTokens(manifest, tokens = {}) {
  const out = defaultSettings(manifest);
  for (const [k, v] of Object.entries(tokens)) {
    const name = settingName(k);
    if (name in out) out[name] = String(v);
  }
  return out;
}

/** A Drupal `<machine>.settings.yml` body. */
export function settingsYaml(machine, settings) {
  return yaml.dump(settings, { lineWidth: 200, noRefs: true, sortKeys: true, quotingType: "'", forceQuotes: false });
}
```

- [ ] **Step 5: Run the tests**

```bash
node --test scripts/theme-cli/tokens.test.mjs
```
Expected: PASS (6 tests). If "color tokens carry a dark counterpart" fails, a color in the manifest is missing its `dark` key — add it.

- [ ] **Step 6: Verification gate (no commit — see Global Constraints)**

```bash
pnpm test 2>&1 | tail -5
```
Expected: all existing tests still pass, plus the 6 new ones.

---

### Task 2: Base theme — regions, templates, runtime tokens, settings form

**Files:**
- Create: `skills/drupal-theme/base-theme/magoo_agentic_base_theme.info.yml`
- Create: `skills/drupal-theme/base-theme/magoo_agentic_base_theme.libraries.yml`
- Create: `skills/drupal-theme/base-theme/magoo_agentic_base_theme.theme`
- Create: `skills/drupal-theme/base-theme/includes/tokens.php`
- Create: `skills/drupal-theme/base-theme/theme-settings.php`
- Create: `skills/drupal-theme/base-theme/templates/{html,page,region,block,node,field}.html.twig`
- Create: `skills/drupal-theme/base-theme/css/src/contract.css`
- Create: `skills/drupal-theme/base-theme/css/src/base.css`
- Create: `skills/drupal-theme/base-theme/package.json`
- Create: `skills/drupal-theme/base-theme/js/color-scheme.js`
- Create: `skills/drupal-theme/base-theme/config/install/magoo_agentic_base_theme.settings.yml` (generated in Step 8)

**Interfaces:**
- Consumes: `tokens.manifest.json` (Task 1) — read by `includes/tokens.php` at runtime.
- Produces: PHP functions `magoo_tokens_manifest(): array`, `magoo_tokens_css(string $theme): string`, `magoo_tokens_defaults(): array`; the region set (used by Task 4's child `.info.yml`); the `settings:` default block.

**The 22 regions** (memorize this list — Task 4 and the templates both use it):
`page_top`, `header_top`, `header`, `primary_menu`, `secondary_menu`, `search`, `breadcrumb`, `highlighted`, `hero`, `hero_secondary`, `content_above`, `content_top`, `content`, `content_bottom`, `content_below`, `sidebar_first`, `sidebar_second`, `pre_footer`, `footer_top`, `footer_columns`, `footer_bottom`, `page_bottom`.

- [ ] **Step 1: `.info.yml` with regions and settings defaults**

```yaml
name: Magoo Agentic Base Theme
type: theme
base theme: false
core_version_requirement: ^11
description: 'Base theme for the Magoo component catalog. Ships the design-token contract as runtime CSS variables, a full token settings form, and a large region set. Subtheme it — do not use it directly.'
libraries:
  - magoo_agentic_base_theme/global

regions:
  page_top: 'Page top'
  header_top: 'Header top'
  header: Header
  primary_menu: 'Primary menu'
  secondary_menu: 'Secondary menu'
  search: Search
  breadcrumb: Breadcrumb
  highlighted: Highlighted
  hero: Hero
  hero_secondary: 'Hero secondary'
  content_above: 'Content above'
  content_top: 'Content top'
  content: Content
  content_bottom: 'Content bottom'
  content_below: 'Content below'
  sidebar_first: 'Sidebar first'
  sidebar_second: 'Sidebar second'
  pre_footer: 'Pre footer'
  footer_top: 'Footer top'
  footer_columns: 'Footer columns'
  footer_bottom: 'Footer bottom'
  page_bottom: 'Page bottom'
```

The `settings:` block is appended in Step 8 by a generator run, so the defaults can never drift from the manifest.

- [ ] **Step 2: Libraries + package.json + color-scheme JS**

`magoo_agentic_base_theme.libraries.yml`:
```yaml
global:
  css:
    theme:
      css/dist/base.css: {}
  js:
    js/color-scheme.js: {}
  dependencies:
    - core/drupal
```

`package.json`:
```json
{
  "name": "magoo_agentic_base_theme",
  "private": true,
  "scripts": {
    "build:css": "npx @tailwindcss/cli -i ./css/src/base.css -o ./css/dist/base.css --minify",
    "dev": "npx @tailwindcss/cli -i ./css/src/base.css -o ./css/dist/base.css --watch"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

`js/color-scheme.js`:
```js
/**
 * Dark-mode toggle. The theme setting decides whether a toggle button exists at all;
 * this only wires it up and persists the choice. `data-color-scheme` on <html> flips the
 * [data-color-scheme="dark"] variable block emitted by hook_preprocess_html().
 */
(function () {
  "use strict";
  var KEY = "magoo-color-scheme";
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (saved) document.documentElement.setAttribute("data-color-scheme", saved);

  function toggle() {
    var next = document.documentElement.getAttribute("data-color-scheme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-color-scheme", next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".magoo-color-scheme-toggle");
    if (btn) { e.preventDefault(); toggle(); }
  });
})();
```

- [ ] **Step 3: `css/src/contract.css` — the Tailwind contract a child imports**

Values here are only the *build-time* defaults; the real values arrive at runtime from theme settings. What matters is that every utility exists and resolves through `var()`.

```css
/*
 * Magoo token contract for Drupal. Imported by the base theme's own CSS entry and by every
 * child theme's entry. Tailwind v4 turns each @theme entry into a utility that REFERENCES the
 * variable (.bg-primary { background-color: var(--color-primary) }), which is exactly why the
 * theme-settings form can restyle the whole catalog at runtime with no rebuild.
 * Never rename or add a variable here — the contract is fixed library-wide.
 */
@theme {
  --color-background: #ffffff;
  --color-on-background: #0f172a;
  --color-surface: #ffffff;
  --color-surface-raised: #f8fafc;
  --color-on-surface: #0f172a;
  --color-on-surface-muted: #64748b;
  --color-primary: #4f46e5;
  --color-primary-contrast: #ffffff;
  --color-secondary: #0f172a;
  --color-secondary-contrast: #ffffff;
  --color-accent: #6366f1;
  --color-accent-contrast: #ffffff;
  --color-border: #e2e8f0;
  --color-ring: #4f46e5;
  --color-success: #16a34a;
  --color-success-contrast: #ffffff;
  --color-warning: #d97706;
  --color-warning-contrast: #ffffff;
  --color-danger: #dc2626;
  --color-danger-contrast: #ffffff;
  --color-info: #2563eb;
  --color-info-contrast: #ffffff;

  --font-heading: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  --radius-control: 0.375rem;
  --radius-button: 0.5rem;
  --radius-card: 0.75rem;
  --radius-pill: 9999px;

  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-raised: 0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.08);
  --shadow-focus: 0 0 0 3px rgba(15, 23, 42, 0.35);
}

:root {
  --weight-heading: 600;
  --weight-body: 400;
  --tracking-heading: -0.01em;
  --space-section: 4rem;
  --space-card: 1.5rem;
  --space-control: 0.75rem;
  --container-max: 72rem;
  --duration-token: 150ms;
  --ease-token: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dynamic utilities composed from props at render time — the scanner can't see them. */
@source inline("grid-cols-{1,2,3,4,5,6,7,8,9,10,11,12}");
@source inline("md:grid-cols-{1,2,3,4,5,6,7,8,9,10,11,12}");
@source inline("lg:grid-cols-{1,2,3,4,5,6,7,8,9,10,11,12}");
@source inline("columns-{1,2,3,4,5,6}");
@source inline("lg:columns-{1,2,3,4,5,6}");

@layer base {
  body {
    background-color: var(--color-background);
    color: var(--color-on-background);
    font-family: var(--font-body);
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: var(--weight-heading);
    letter-spacing: var(--tracking-heading);
  }
}
```

`css/src/base.css` (the base theme's own entry — templates only):
```css
@import "tailwindcss";
@import "./contract.css";
@source "../../templates";
```

- [ ] **Step 4: `includes/tokens.php` — manifest → CSS**

```php
<?php

/**
 * @file
 * Token manifest reader. The manifest (tokens.manifest.json) is the single source of truth
 * shared with the JS generator; this file turns theme settings into the runtime :root block.
 */

/**
 * Loads the token manifest from the BASE theme (a subtheme has none of its own).
 */
function magoo_tokens_manifest(): array {
  static $manifest = NULL;
  if ($manifest === NULL) {
    $path = \Drupal::service('extension.list.theme')->getPath('magoo_agentic_base_theme') . '/tokens.manifest.json';
    $manifest = json_decode(file_get_contents($path), TRUE) ?: ['groups' => []];
  }
  return $manifest;
}

/**
 * Flat list of every token in the manifest.
 */
function magoo_tokens_list(): array {
  $out = [];
  foreach (magoo_tokens_manifest()['groups'] as $group) {
    foreach ($group['tokens'] as $token) {
      $out[$token['key']] = $token;
    }
  }
  return $out;
}

/**
 * Every setting at its manifest default (plus the _dark counterpart of each color).
 */
function magoo_tokens_defaults(): array {
  $out = [];
  foreach (magoo_tokens_list() as $key => $token) {
    $out['magoo_' . $key] = (string) $token['default'];
    if ($token['type'] === 'color') {
      $out['magoo_' . $key . '_dark'] = (string) ($token['dark'] ?? $token['default']);
    }
  }
  return $out;
}

/**
 * Reads a setting, falling back to the manifest default when it is unset or empty.
 */
function magoo_token_value(string $theme, string $key, array $defaults): string {
  $value = theme_get_setting('magoo_' . $key, $theme);
  if ($value === NULL || $value === '') {
    return $defaults['magoo_' . $key] ?? '';
  }
  return (string) $value;
}

/**
 * Derives --text-sm … --text-5xl from the base size and the scale ratio.
 */
function magoo_type_scale(string $base, string $ratio): array {
  $unit = str_ends_with($base, 'px') ? 'px' : 'rem';
  $size = (float) $base;
  $r = (float) $ratio ?: 1.25;
  $steps = ['xs' => -2, 'sm' => -1, 'base' => 0, 'lg' => 1, 'xl' => 2, '2xl' => 3, '3xl' => 4, '4xl' => 5, '5xl' => 6];
  $out = [];
  foreach ($steps as $name => $exp) {
    $out['--text-' . $name] = round($size * pow($r, $exp), 4) . $unit;
  }
  return $out;
}

/**
 * The full runtime :root block for a theme — light values, dark values, and the escape hatch.
 */
function magoo_tokens_css(string $theme): string {
  $defaults = magoo_tokens_defaults();
  $tokens = magoo_tokens_list();

  $light = [];
  $dark = [];
  foreach ($tokens as $key => $token) {
    if (empty($token['var'])) {
      continue;
    }
    $light[$token['var']] = magoo_token_value($theme, $key, $defaults);
    if ($token['type'] === 'color') {
      $value = theme_get_setting('magoo_' . $key . '_dark', $theme);
      $dark[$token['var']] = ($value === NULL || $value === '')
        ? ($defaults['magoo_' . $key . '_dark'] ?? '')
        : (string) $value;
    }
  }

  // The type scale rides on the same two settings.
  $light += magoo_type_scale(
    magoo_token_value($theme, 'text_base', $defaults),
    magoo_token_value($theme, 'scale_ratio', $defaults)
  );

  $declare = static function (array $vars): string {
    $out = '';
    foreach ($vars as $name => $value) {
      if ($value !== '') {
        $out .= $name . ':' . $value . ';';
      }
    }
    return $out;
  };

  $custom = magoo_token_value($theme, 'custom_css_vars', $defaults);
  $css = ':root{' . $declare($light) . $custom . '}';

  $scheme = magoo_token_value($theme, 'color_scheme', $defaults);
  $darkCss = $declare($dark);
  if ($darkCss !== '') {
    if ($scheme === 'dark') {
      $css .= ':root{' . $darkCss . '}';
    }
    if ($scheme === 'auto' || $scheme === 'toggle') {
      $css .= '@media (prefers-color-scheme: dark){:root:not([data-color-scheme="light"]){' . $darkCss . '}}';
    }
    $css .= ':root[data-color-scheme="dark"]{' . $darkCss . '}';
  }
  return $css;
}
```

- [ ] **Step 5: `magoo_agentic_base_theme.theme` — emit the CSS, thread layout settings to Twig**

```php
<?php

/**
 * @file
 * Magoo Agentic Base Theme — base theme for the Magoo component catalog.
 */

use Drupal\Core\Cache\CacheableMetadata;

require_once __DIR__ . '/includes/tokens.php';

/**
 * Implements hook_preprocess_HOOK() for html.
 *
 * Renders the design tokens into an inline :root block. Because Tailwind's utilities
 * reference the variables (var(--color-primary)) rather than baking in the value, this
 * restyles every component with no CSS rebuild.
 */
function magoo_agentic_base_theme_preprocess_html(array &$variables): void {
  $theme = \Drupal::theme()->getActiveTheme()->getName();
  $defaults = magoo_tokens_defaults();

  $variables['#attached']['html_head'][] = [
    [
      '#tag' => 'style',
      '#value' => magoo_tokens_css($theme),
      '#weight' => 100,
      '#attributes' => ['data-magoo-tokens' => 'true'],
    ],
    'magoo_tokens',
  ];

  $source = magoo_token_value($theme, 'font_source', $defaults);
  $url = magoo_token_value($theme, 'font_url', $defaults);
  if ($source !== 'none' && $url !== '') {
    $variables['#attached']['html_head_link'][] = [
      ['rel' => 'stylesheet', 'href' => $url, 'crossorigin' => 'anonymous'],
    ];
  }

  $scheme = magoo_token_value($theme, 'color_scheme', $defaults);
  if ($scheme === 'dark') {
    $variables['html_attributes']->setAttribute('data-color-scheme', 'dark');
  }

  // The token block is settings-derived, so the page cache must drop when they change.
  CacheableMetadata::createFromRenderArray($variables)
    ->addCacheableDependency(\Drupal::config($theme . '.settings'))
    ->applyTo($variables);
}

/**
 * Implements hook_preprocess_HOOK() for page.
 *
 * Threads the layout settings into Twig, and drops any region the site turned off.
 */
function magoo_agentic_base_theme_preprocess_page(array &$variables): void {
  $theme = \Drupal::theme()->getActiveTheme()->getName();
  $defaults = magoo_tokens_defaults();

  $split = static fn(string $value): array => array_values(array_filter(array_map('trim', explode(',', $value))));

  $hidden = $split(magoo_token_value($theme, 'hidden_regions', $defaults));
  foreach ($hidden as $region) {
    unset($variables['page'][$region]);
  }

  $variables['magoo'] = [
    'full_bleed' => $split(magoo_token_value($theme, 'full_bleed_regions', $defaults)),
    'sidebar_position' => magoo_token_value($theme, 'sidebar_position', $defaults),
    'sticky_header' => (bool) magoo_token_value($theme, 'sticky_header', $defaults),
    'color_scheme' => magoo_token_value($theme, 'color_scheme', $defaults),
  ];
}
```

- [ ] **Step 6: `theme-settings.php` — the form, built from the manifest**

Drupal includes a **base** theme's `theme-settings.php` when building a subtheme's settings form, so this file serves every child. (Step 9 verifies that empirically — if it does not hold on this Drupal version, the fallback is for `create-child` to write a one-line `theme-settings.php` in the child that `require_once`s this one.)

```php
<?php

/**
 * @file
 * Theme settings for magoo_agentic_base_theme and every subtheme of it.
 *
 * The whole form is generated from tokens.manifest.json — add a token there and it shows up
 * here, in the runtime CSS, and in the child-theme generator at once.
 */

/**
 * Implements hook_form_system_theme_settings_alter().
 */
function magoo_agentic_base_theme_form_system_theme_settings_alter(array &$form, \Drupal\Core\Form\FormStateInterface $form_state): void {
  $module_handler = \Drupal::moduleHandler();
  $path = \Drupal::service('extension.list.theme')->getPath('magoo_agentic_base_theme');
  require_once DRUPAL_ROOT . '/' . $path . '/includes/tokens.php';

  $form['magoo'] = [
    '#type' => 'vertical_tabs',
    '#title' => t('Design tokens'),
    '#weight' => -100,
    '#description' => t('Every value here is written into the page as a CSS variable. Components restyle immediately — no CSS rebuild. Only newly ADDED component classes need a Tailwind rebuild.'),
  ];

  foreach (magoo_tokens_manifest()['groups'] as $group) {
    $key = 'magoo_group_' . $group['key'];
    $form[$key] = [
      '#type' => 'details',
      '#title' => $group['label'],
      '#group' => 'magoo',
    ];
    if (!empty($group['description'])) {
      $form[$key]['description'] = ['#markup' => '<p>' . $group['description'] . '</p>'];
    }

    foreach ($group['tokens'] as $token) {
      $name = 'magoo_' . $token['key'];
      $element = [
        '#title' => $token['label'],
        '#default_value' => theme_get_setting($name) ?? $token['default'],
      ];
      if (!empty($token['description'])) {
        $element['#description'] = $token['description'];
      }

      switch ($token['type']) {
        case 'color':
          $element['#type'] = 'color';
          break;

        case 'select':
          $element['#type'] = 'select';
          $element['#options'] = $token['options'];
          break;

        case 'checkbox':
          $element['#type'] = 'checkbox';
          break;

        case 'textarea':
          $element['#type'] = 'textarea';
          $element['#rows'] = 6;
          break;

        default:
          $element['#type'] = 'textfield';
      }

      $form[$key][$name] = $element;

      // Colors get a dark-mode counterpart right beside the light value.
      if ($token['type'] === 'color') {
        $form[$key][$name . '_dark'] = [
          '#type' => 'color',
          '#title' => t('@label (dark)', ['@label' => $token['label']]),
          '#default_value' => theme_get_setting($name . '_dark') ?? ($token['dark'] ?? $token['default']),
        ];
      }
    }
  }
}
```

- [ ] **Step 7: Templates**

`templates/html.html.twig` — copy Drupal core's stable9 `html.html.twig` and add nothing but `{{ html_attributes }}` support (core's already has it). Simplest correct approach: **do not override `html.html.twig` at all** unless a change is needed; `html_attributes` set in preprocess already lands. Skip this file.

`templates/page.html.twig`:
```twig
{#
  Page layout. Regions listed in the "Full-bleed regions" setting run edge to edge; every other
  region is centered in a container capped at --container-max. Region visibility and sidebar
  position also come from theme settings (see magoo_agentic_base_theme_preprocess_page()).
#}
{% set bleed = magoo.full_bleed %}
{% set header_class = magoo.sticky_header ? 'sticky top-0 z-50' : '' %}

{% macro region(page, name, bleed, extra) %}
  {% if page[name] %}
    {% if name in bleed %}
      <div class="region region--{{ name }} {{ extra }}">{{ page[name] }}</div>
    {% else %}
      <div class="region region--{{ name }} {{ extra }}">
        <div class="mx-auto w-full px-4" style="max-width: var(--container-max);">{{ page[name] }}</div>
      </div>
    {% endif %}
  {% endif %}
{% endmacro %}
{% import _self as r %}

<div class="page min-h-screen bg-background font-body text-on-background">
  {{ r.region(page, 'header_top', bleed, '') }}
  {{ r.region(page, 'header', bleed, header_class ~ ' bg-surface') }}
  {{ r.region(page, 'primary_menu', bleed, '') }}
  {{ r.region(page, 'secondary_menu', bleed, '') }}
  {{ r.region(page, 'search', bleed, '') }}
  {{ r.region(page, 'breadcrumb', bleed, '') }}
  {{ r.region(page, 'highlighted', bleed, '') }}
  {{ r.region(page, 'hero', bleed, '') }}
  {{ r.region(page, 'hero_secondary', bleed, '') }}
  {{ r.region(page, 'content_above', bleed, '') }}

  <main class="flex flex-col gap-(--space-section) py-(--space-section)">
    {% set has_sidebar = page.sidebar_first or page.sidebar_second %}
    <div class="mx-auto flex w-full flex-col gap-8 px-4 lg:flex-row {{ magoo.sidebar_position == 'first' ? 'lg:flex-row-reverse' : '' }}" style="max-width: var(--container-max);">
      <div class="min-w-0 flex-1">
        {% if page.content_top %}<div class="region region--content_top">{{ page.content_top }}</div>{% endif %}
        <div class="region region--content">{{ page.content }}</div>
        {% if page.content_bottom %}<div class="region region--content_bottom">{{ page.content_bottom }}</div>{% endif %}
      </div>
      {% if has_sidebar %}
        <aside class="w-full shrink-0 lg:w-72">
          {% if page.sidebar_first %}<div class="region region--sidebar_first">{{ page.sidebar_first }}</div>{% endif %}
          {% if page.sidebar_second %}<div class="region region--sidebar_second">{{ page.sidebar_second }}</div>{% endif %}
        </aside>
      {% endif %}
    </div>
  </main>

  {{ r.region(page, 'content_below', bleed, '') }}
  {{ r.region(page, 'pre_footer', bleed, '') }}
  {{ r.region(page, 'footer_top', bleed, '') }}
  {{ r.region(page, 'footer_columns', bleed, '') }}
  {{ r.region(page, 'footer_bottom', bleed, 'bg-surface-raised text-on-surface-muted') }}
</div>
```

`templates/region.html.twig`:
```twig
{% if content %}
  <div{{ attributes }}>{{ content }}</div>
{% endif %}
```

`templates/block.html.twig`:
```twig
<div{{ attributes }}>
  {{ title_prefix }}
  {% if label %}<h2{{ title_attributes.addClass('font-heading text-xl') }}>{{ label }}</h2>{% endif %}
  {{ title_suffix }}
  {% block content %}{{ content }}{% endblock %}
</div>
```

`templates/node.html.twig`:
```twig
<article{{ attributes.addClass('node') }}>
  {{ title_prefix }}
  {% if label and not page %}
    <h2{{ title_attributes.addClass('font-heading text-2xl') }}><a href="{{ url }}">{{ label }}</a></h2>
  {% endif %}
  {{ title_suffix }}
  <div{{ content_attributes.addClass('node__content', 'flex', 'flex-col', 'gap-(--space-section)') }}>
    {{ content }}
  </div>
</article>
```

`templates/field.html.twig`: skip — core's default is fine and overriding it risks breaking admin UIs. (Remove it from the Files list if present.)

- [ ] **Step 8: Generate the `settings:` defaults into the `.info.yml` and `config/install`**

Run this one-off script so the defaults can never drift from the manifest:

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
node -e '
import("./scripts/theme-cli/tokens.mjs").then(async (t) => {
  const fs = await import("node:fs/promises");
  const yaml = (await import("js-yaml")).default;
  const m = await t.loadManifest();
  const s = t.defaultSettings(m);
  const dir = "skills/drupal-theme/base-theme";
  const info = await fs.readFile(dir + "/magoo_agentic_base_theme.info.yml", "utf8");
  await fs.writeFile(dir + "/magoo_agentic_base_theme.info.yml",
    info.trimEnd() + "\n\n# Defaults generated from tokens.manifest.json — inherited by every subtheme.\nsettings:\n" +
    Object.entries(s).map(([k, v]) => "  " + k + ": " + yaml.dump(v).trim()).join("\n") + "\n");
  await fs.mkdir(dir + "/config/install", { recursive: true });
  await fs.writeFile(dir + "/config/install/magoo_agentic_base_theme.settings.yml", t.settingsYaml("magoo_agentic_base_theme", s));
  console.log("wrote settings defaults:", Object.keys(s).length);
});
'
```
Expected output: `wrote settings defaults: 62` (roughly — 22 colors × 2 + the rest).

- [ ] **Step 9: Install it in DDEV and verify it renders + the form appears**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
mkdir -p custom_theme/web/themes/custom
cp -r skills/drupal-theme/base-theme custom_theme/web/themes/custom/magoo_agentic_base_theme
cd custom_theme
ddev npm install --prefix web/themes/custom/magoo_agentic_base_theme
ddev npm run build:css --prefix web/themes/custom/magoo_agentic_base_theme
ddev drush theme:enable magoo_agentic_base_theme -y
ddev drush cr
curl -sk https://custom-theme.ddev.site/ -o /dev/null -w '%{http_code}\n'
```
Expected: `200`, and `css/dist/base.css` exists and is non-empty.

Then confirm the settings form renders and the token block is in the page:
```bash
ddev drush uli --uri=https://custom-theme.ddev.site   # log in as admin
```
Open `/admin/appearance/settings/magoo_agentic_base_theme` with the **agent-browser** skill: the vertical tabs Brand / Colors / Typography / Shape / Elevation / Spacing / Motion / Layout / Advanced must all be present with populated fields. Then check the runtime block:
```bash
curl -sk https://custom-theme.ddev.site/ | grep -o 'data-magoo-tokens[^>]*' | head -1
curl -sk https://custom-theme.ddev.site/ | grep -o -- '--color-primary:[^;]*' | head -1
```
Expected: the style tag is present and `--color-primary:#4f46e5`.

- [ ] **Step 10: Verification gate — settings inheritance spike**

This is the one assumption the design flagged. Prove it before Task 4 depends on it:

```bash
cd /home/marcus/Documents/Projects/magoocomponentui/custom_theme
mkdir -p web/themes/custom/magoo_probe
printf 'name: Magoo Probe\ntype: theme\nbase theme: magoo_agentic_base_theme\ncore_version_requirement: ^11\n' > web/themes/custom/magoo_probe/magoo_probe.info.yml
ddev drush theme:enable magoo_probe -y && ddev drush cr
```
Open `/admin/appearance/settings/magoo_probe` in agent-browser.
- **Expected (assumption holds):** the same Brand/Colors/… tabs appear. Continue.
- **If the tabs are missing:** the fallback applies — `create-child` must also write a child `theme-settings.php` containing:
  ```php
  <?php
  require_once DRUPAL_ROOT . '/' . \Drupal::service('extension.list.theme')->getPath('magoo_agentic_base_theme') . '/theme-settings.php';
  function CHILD_form_system_theme_settings_alter(array &$form, \Drupal\Core\Form\FormStateInterface $form_state): void {
    magoo_agentic_base_theme_form_system_theme_settings_alter($form, $form_state);
  }
  ```
  Record which branch was taken in `.agents/decisions.md` and adjust Task 4 accordingly.

Then clean up the probe:
```bash
ddev drush theme:uninstall magoo_probe -y ; rm -rf web/themes/custom/magoo_probe ; ddev drush cr
```

---

### Task 3: `install-base` subcommand

**Files:**
- Create: `scripts/theme-cli/install-base.mjs`
- Test: `scripts/theme-cli/install-base.test.mjs`
- Modify: `scripts/theme-cli.mjs`

**Interfaces:**
- Consumes: `BASE_THEME_DIR`, `BASE_MACHINE` from `tokens.mjs` (Task 1).
- Produces: `runInstallBase(argv)` and `installBaseTheme(destThemesDir): Promise<string>` (returns the created theme dir). Used by Task 4.

- [ ] **Step 1: Write the failing test**

```js
// scripts/theme-cli/install-base.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, stat, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { installBaseTheme } from "./install-base.mjs";

test("installBaseTheme copies the base theme into a themes dir", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "magoo-base-"));
  const out = await installBaseTheme(dir);
  assert.equal(out, path.join(dir, "magoo_agentic_base_theme"));
  for (const f of ["magoo_agentic_base_theme.info.yml", "theme-settings.php", "includes/tokens.php", "tokens.manifest.json", "css/src/contract.css"]) {
    await stat(path.join(out, f)); // throws if missing
  }
  const info = await readFile(path.join(out, "magoo_agentic_base_theme.info.yml"), "utf8");
  assert.match(info, /regions:/);
  assert.match(info, /settings:/);
});

test("installBaseTheme does not copy node_modules or a built css dir", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "magoo-base-"));
  const out = await installBaseTheme(dir);
  await assert.rejects(() => stat(path.join(out, "node_modules")));
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node --test scripts/theme-cli/install-base.test.mjs
```
Expected: FAIL — `Cannot find module './install-base.mjs'`.

- [ ] **Step 3: Implement**

```js
// scripts/theme-cli/install-base.mjs
/** Copy the canonical base theme into a Drupal themes directory. */
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseFlags } from "./search.mjs";
import { BASE_THEME_DIR, BASE_MACHINE } from "./tokens.mjs";

const SKIP = new Set(["node_modules", ".git"]);

/**
 * @param {string} themesDir  e.g. web/themes/custom
 * @returns {Promise<string>} the installed theme directory
 */
export async function installBaseTheme(themesDir) {
  const dest = path.join(themesDir, BASE_MACHINE);
  await mkdir(themesDir, { recursive: true });
  await cp(BASE_THEME_DIR, dest, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)),
  });
  return dest;
}

export async function runInstallBase(argv) {
  const f = parseFlags(argv);
  if (!f.out) throw new Error("install-base: pass --out <web/themes/custom>");
  const dest = await installBaseTheme(f.out);
  process.stderr.write(
    `Base theme installed → ${dest}\n` +
    `Next: npm install && npm run build:css in that directory, then enable it (it is a base theme — subtheme it with create-child).\n`
  );
}
```

- [ ] **Step 4: Register the subcommand**

In `scripts/theme-cli.mjs`, add the imports and the map entries:
```js
import { runInstallBase } from "./theme-cli/install-base.mjs";
import { runCreateChild } from "./theme-cli/create-child.mjs";

const commands = {
  search: runSearch,
  build: runBuild,
  config: runConfig,
  "create-theme": runCreateTheme,
  "install-base": runInstallBase,
  "create-child": runCreateChild,
};
```
and update the usage string to `theme-cli <search|build|config|create-theme|install-base|create-child> [args]`.

(Task 3 leaves `create-child.mjs` unwritten, so run the tests with `node --test scripts/theme-cli/install-base.test.mjs` here; the CLI import lands green at the end of Task 4.)

- [ ] **Step 5: Run the tests**

```bash
node --test scripts/theme-cli/install-base.test.mjs
```
Expected: PASS (2 tests).

---

### Task 4: `create-child` generator + vendored agent skills

**Files:**
- Create: `scripts/theme-cli/child-skill.mjs`
- Create: `scripts/theme-cli/create-child.mjs`
- Test: `scripts/theme-cli/create-child.test.mjs`

**Interfaces:**
- Consumes: `loadManifest`, `settingsFromTokens`, `settingsYaml`, `BASE_MACHINE` (Task 1); `installBaseTheme` (Task 3); existing `buildFilesFor(id, target)` from `./build.mjs`, `configFilesFor(id, opts)` from `./config.mjs`, `themePath`, `hostContentTypeConfig` from `./create-theme.mjs`.
- Produces: `runCreateChild(argv)`, `childFiles(answers, manifest): Record<string,string>` (the non-component files, so it is unit-testable without touching disk).

**Answers JSON shape** (written by the spec-kit skill in Task 5):
```json
{
  "machine_name": "elevenlabs_theme",
  "name": "ElevenLabs Theme",
  "description": "Product marketing site styled after the ElevenLabs design system.",
  "purpose": "Marketing + docs site for an AI audio product.",
  "reference": "https://styles.refero.design/style/031056ff-7af1-46db-8daa-115f731c5d26",
  "tokens": {
    "color_primary": "#0447ff",
    "color_background": "#fdfcfc",
    "font_heading": "\"Waldenburg\", ui-sans-serif, system-ui, sans-serif",
    "radius_card": "20px",
    "radius_button": "9999px"
  },
  "host_content_type": { "machine": "landing_page", "name": "Landing Page" },
  "components": [
    { "id": "marketing/hero-split", "config": "paragraph", "props": { "align": "left" } }
  ]
}
```
`tokens` keys are **manifest token keys** (not CSS variables, not setting names). Anything omitted keeps the base default.

- [ ] **Step 1: Write the failing test**

```js
// scripts/theme-cli/create-child.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadManifest } from "./tokens.mjs";
import { childFiles } from "./create-child.mjs";

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
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node --test scripts/theme-cli/create-child.test.mjs
```
Expected: FAIL — `Cannot find module './create-child.mjs'`.

- [ ] **Step 3: Write `child-skill.mjs` (the vendored skill text)**

```js
// scripts/theme-cli/child-skill.mjs
/** The agent tooling vendored INTO a generated child theme, so the theme is self-contained. */

/** @param {string} machine @param {string} name */
export function childSkillMd(machine, name) {
  return `---
name: magoo-components
description: Search the Magoo component catalog and install components into this Drupal theme (${name}). Use when asked to add, find, or update a component in this theme.
---

# Magoo components — ${name}

This theme is a subtheme of \`magoo_agentic_base_theme\` and is built from the Magoo component
catalog. Components are CSS-less SDC: their markup is tokenized Tailwind bound to the CSS
variables the base theme emits from its settings form.

## The CLI

Everything goes through the bootstrap vendored beside this skill:

\`\`\`
node .claude/skills/magoo-components/bin/magoo search --q "pricing"
node .claude/skills/magoo-components/bin/magoo search --category commerce --json
\`\`\`

It fetches and caches the component repo (1-day TTL) on first use. Requires Node and git.

## Add a component

1. Find it: \`magoo search --q "<words>"\` → note the id (\`<category>/<name>\`).
2. Build the SDC into this theme and generate its Drupal config:
   \`\`\`
   node .claude/skills/magoo-components/bin/magoo build <id> --target sdc --out components
   node .claude/skills/magoo-components/bin/magoo config <id> --as paragraph --theme ${machine} --out config/install
   \`\`\`
   Use \`--as node\` instead for a component that IS a page, and \`--as paragraph\` for anything an
   editor stacks (and for components with nested-array props — the flat node model renders those empty).
3. **Rebuild the CSS — required after every component add**, because Tailwind only emits utility
   classes it saw at build time:
   \`\`\`
   ddev npm install            # first time only
   ddev npm run build:css
   \`\`\`
   (Outside DDEV: \`npm install && npm run build:css\` in this theme directory.)
4. Import the config and clear caches:
   \`\`\`
   ddev drush cim --partial --source=$(pwd)/config/install -y
   ddev drush cr
   \`\`\`
5. Enable any module the component's config needs — they are listed in \`${machine}.info.yml\`
   under \`dependencies:\`.

## Restyle

Do NOT write CSS and do NOT fork a component's Twig. Styling is:

- **Token values** — /admin/appearance/settings/${machine} (colors, fonts, radii, shadows,
  spacing/density, motion). These are runtime CSS variables: they take effect on cache-clear
  with NO CSS rebuild.
- **Variants and props** — each component's enum props pick its look; see its
  \`components/<name>/<name>.component.yml\`.

## Remove a component

Not automated. Remove it by hand and expect dangling references: its \`components/<name>/\`, its
\`config/install/*.yml\`, its \`templates/paragraph--<name>.html.twig\`, plus any content already
using the paragraph type. Uninstall the paragraph type before deleting its config.
`;
}

/** @param {string} machine @param {string} name */
export function childClaudeMd(machine, name) {
  return `# ${name} (\`${machine}\`)

A Drupal subtheme of \`magoo_agentic_base_theme\`, built from the Magoo component catalog.

- **Add/find components:** use the \`magoo-components\` skill in \`.claude/skills/magoo-components/\`.
- **Styling is settings, not CSS.** Colors, fonts, radii, shadows, spacing and motion are runtime
  CSS variables set at \`/admin/appearance/settings/${machine}\`. Never add a stylesheet, never fork
  a component's Twig.
- **After adding a component you MUST rebuild the CSS** (Tailwind only emits classes it saw):
  \`\`\`
  ddev npm install     # first time only
  ddev npm run build:css
  \`\`\`
- Components live in \`components/\`, their Drupal config in \`config/install/\`.
`;
}
```

- [ ] **Step 4: Write `create-child.mjs`**

```js
// scripts/theme-cli/create-child.mjs
/** Generate a child theme of magoo_agentic_base_theme from an answers JSON. */
import { readFile, mkdir, writeFile, cp, stat } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { parseFlags } from "./search.mjs";
import { buildFilesFor } from "./build.mjs";
import { configFilesFor } from "./config.mjs";
import { themePath, hostContentTypeConfig } from "./create-theme.mjs";
import { loadManifest, settingsFromTokens, settingsYaml, BASE_MACHINE, BASE_THEME_DIR } from "./tokens.mjs";
import { installBaseTheme } from "./install-base.mjs";
import { childSkillMd, childClaudeMd } from "./child-skill.mjs";

const BOOTSTRAP = path.join(BASE_THEME_DIR, "../bin"); // skills/drupal-theme/bin — the existing magoo bootstrap

/** The non-component files of a child theme. Pure — unit-testable without disk. */
export function childFiles(ans, manifest) {
  const machine = ans.machine_name;
  const files = {};

  files[`${machine}.info.yml`] =
    `name: ${ans.name}\n` +
    `type: theme\n` +
    `base theme: ${BASE_MACHINE}\n` +
    `core_version_requirement: ^11\n` +
    `description: '${String(ans.description || "").replace(/'/g, "''")}'\n` +
    `libraries:\n  - ${machine}/global\n`;

  files[`${machine}.libraries.yml`] = `global:\n  css:\n    theme:\n      css/dist/styles.css: {}\n`;

  files[`config/install/${machine}.settings.yml`] = settingsYaml(machine, settingsFromTokens(manifest, ans.tokens || {}));

  files["css/src/styles.css"] =
    `/*\n` +
    ` * Tailwind entry for ${machine}. Scans the base theme's templates and this theme's own\n` +
    ` * components + templates, so only the utility classes actually in use are emitted.\n` +
    ` * Re-run \`npm run build:css\` after adding a component.\n` +
    ` */\n` +
    `@import "tailwindcss";\n` +
    `@import "../../../${BASE_MACHINE}/css/src/contract.css";\n` +
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

/** Union the `dependencies.module` of every YAML config in a map into `set`. */
function collectModuleDeps(map, set) {
  for (const [rel, contents] of Object.entries(map)) {
    if (!rel.endsWith(".yml")) continue;
    try {
      const obj = yaml.load(contents);
      for (const m of (obj?.dependencies?.module) || []) set.add(m);
    } catch { /* twig — ignore */ }
  }
}

function bundlesIn(map) {
  const out = [];
  for (const rel of Object.keys(map)) {
    const m = /paragraphs\.paragraphs_type\.([a-z0-9_]+)\.yml$/.exec(rel);
    if (m) out.push(m[1]);
  }
  return out;
}

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

export async function runCreateChild(argv) {
  const f = parseFlags(argv);
  if (!f.answers) throw new Error("create-child: pass --answers <file.json>");
  const ans = JSON.parse(await readFile(f.answers, "utf8"));
  if (!ans.machine_name || !ans.name) throw new Error("create-child: answers need machine_name and name");

  const themesDir = f["themes-dir"] || f.out || ".";
  const themeDir = path.join(themesDir, ans.machine_name);
  const manifest = await loadManifest();

  // The child is useless without its base — install it if the site doesn't have it yet.
  if (!(await exists(path.join(themesDir, BASE_MACHINE)))) {
    await installBaseTheme(themesDir);
    process.stderr.write(`Base theme installed → ${path.join(themesDir, BASE_MACHINE)}\n`);
  }

  await mkdir(themeDir, { recursive: true });
  for (const [rel, contents] of Object.entries(childFiles(ans, manifest))) {
    const dest = path.join(themeDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
  }

  // Vendor the `magoo` bootstrap next to the skill so the theme is self-contained.
  await cp(BOOTSTRAP, path.join(themeDir, ".claude/skills/magoo-components/bin"), { recursive: true });

  const moduleDeps = new Set();
  const bundles = [];
  for (const c of ans.components || []) {
    const built = await buildFilesFor(c.id, "sdc");
    for (const [rel, contents] of Object.entries(built)) {
      const dest = path.join(themeDir, themePath(rel));
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
    const mode = c.config || "paragraph";
    const opts = mode === "custom-field"
      ? { as: "custom-field", entity: c.entity, bundle: c.bundle }
      : { as: mode, theme: ans.machine_name };
    const map = await configFilesFor(c.id, opts);
    for (const [rel, contents] of Object.entries(map)) {
      const dest = path.join(themeDir, themePath(rel));
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
    collectModuleDeps(map, moduleDeps);
    if (mode === "paragraph") bundles.push(...bundlesIn(map));
  }

  if (ans.host_content_type && bundles.length) {
    const { files, templates } = hostContentTypeConfig(ans.host_content_type, bundles);
    for (const [rel, contents] of Object.entries({ ...files, ...templates })) {
      const dest = path.join(themeDir, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
    collectModuleDeps(files, moduleDeps);
  }

  if (moduleDeps.size) {
    const infoPath = path.join(themeDir, `${ans.machine_name}.info.yml`);
    let info = await readFile(infoPath, "utf8");
    info += "\n# Modules the imported config requires — enable them before installing the theme.\ndependencies:\n"
      + [...moduleDeps].sort().map((m) => `  - ${m}`).join("\n") + "\n";
    await writeFile(infoPath, info);
  }

  process.stderr.write(
    `Child theme scaffolded → ${themeDir}\n` +
    `Next:\n` +
    `  ddev composer require ${[...moduleDeps].map((m) => "drupal/" + m).join(" ") || "(no extra modules)"}\n` +
    `  ddev drush en ${[...moduleDeps].join(" ")} -y\n` +
    `  ddev npm install --prefix ${themeDir} && ddev npm run build:css --prefix ${themeDir}\n` +
    `  ddev drush theme:enable ${ans.machine_name} -y && ddev drush config:set system.theme default ${ans.machine_name} -y\n` +
    `  ddev drush cim --partial --source=${themeDir}/config/install -y && ddev drush cr\n`
  );
}
```

- [ ] **Step 5: Run the tests**

```bash
node --test scripts/theme-cli/create-child.test.mjs
```
Expected: PASS (5 tests).

- [ ] **Step 6: Verification gate**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
node scripts/theme-cli.mjs 2>&1 | head -2   # usage line lists install-base|create-child
pnpm test 2>&1 | tail -5                    # everything still green
```

---

### Task 5: The spec-kit skill

**Files:**
- Create: `skills/drupal-theme-spec/SKILL.md`
- Create: `skills/drupal-theme-spec/references/design-reference.md`
- Modify: `skills/drupal-theme/SKILL.md` (add a pointer to the new commands + the new skill)

**Interfaces:**
- Consumes: `magoo search`, `magoo create-child` (Task 4).
- Produces: nothing programmatic — this is the questionnaire an agent follows.

- [ ] **Step 1: Write `skills/drupal-theme-spec/SKILL.md`**

```markdown
---
name: drupal-theme-spec
description: Spec-kit for generating a Drupal theme from the Magoo component catalog — takes a design reference (a Refero style URL, a live site, a screenshot, or a description) plus what the site is for, then picks and styles at least 15 components and scaffolds a child theme. Use when the user wants a new themed Drupal site or a theme built to match a design.
---

# Drupal theme spec-kit

Turns "here is a design I like, here is what the site is for" into a working Drupal child theme of
`magoo_agentic_base_theme`, with at least 15 catalog components styled to match.

**Do not start scaffolding until every section below is answered.** The point of this skill is that
you ask, not guess. Ask about one section at a time.

## 1. The design reference

Ask which of these the user has, and take the first one available:

| Reference | What to do |
|---|---|
| **Refero style URL** (`styles.refero.design/style/<id>`) | Fetch it — the pages are server-rendered and fully tokenized. Read out the palette (hex), font families + weights, the type scale, spacing values, named radii and shadow presets. |
| **A live site URL** | Open it with the `agent-browser` skill and read computed styles off the real DOM (background, text, accent, border colors; font families; border-radius; shadows). Cluster into a palette. |
| **A screenshot or image** | Read the image, name the palette and the type feel. Lowest fidelity — say so. |
| **A description only** | Use the `frontend-design` skill to compose a token set from the described mood. |
| **Nothing usable** | **Interrogate** — do not invent. Brand name and what it sells; mood in three adjectives; light, dark, or both; serif/sans/mono for headings; dense or airy; sharp or rounded; one accent color or several. Keep asking until you can fill every group in `tokens.manifest.json`. |

Then map what you found onto the token keys in
`skills/drupal-theme/base-theme/tokens.manifest.json` and **show the user the mapping before
writing it** — a table of `token key → value → where it came from`. See
`references/design-reference.md` for the mapping rules (which reference color becomes
`color_primary` vs `color_accent`, how a type scale becomes `text_base` + `scale_ratio`, etc.).

## 2. What is the theme for?

Ask, and write the answers down — they drive component selection:

- What is the site for, in one sentence? Who visits it?
- What kinds of pages does it need (landing, article, product, dashboard, docs, event, …)?
- What content does it publish (articles, products, videos, matches, courses, …)?
- Does an editor need to assemble pages from blocks? (→ `host_content_type`)
- Light, dark, or both? Dense or airy? Wide or narrow measure?

## 3. Pick the components (at least 15)

Search the catalog against the purpose — several queries, not one:

    node <drupal-theme-skill>/bin/magoo search --q "<purpose words>" --json
    node <drupal-theme-skill>/bin/magoo search --category <category> --json

Assemble **at least 15** components, more when the purpose warrants. Cover, at minimum: a navbar, a
hero, a primary content card, a grid/container for those cards, a CTA, a footer, and whatever the
content types demand. Present them as a table of `id → why this one`, and confirm the set.

**Containers matter:** a leaf card needs a container with an `items` slot (card-grid, product-grid,
card-slider, …) to be usable on a page. Check each card's `relationships.parents`.

## 4. Style them — tokens and props only

- The design reference sets the **token values** (step 1). That is what restyles the components.
- Per component, choose the **enum variants and props** that match the reference (pill vs. square
  buttons, bordered vs. elevated cards, compact vs. roomy). Read each component's
  `component.def.yml` for its enums.
- **Never** write a CSS override and **never** fork a component's Twig. Both break the contract: a
  restyle must stay a settings change, and a component must keep tracking the catalog.

## 5. Config mode per component

- `paragraph` — the default. An editor stacks it inside a page. **Required** for components with
  nested-array props (tables, calendars) — the flat node model renders those empty.
- `node` — the component IS the page (one content type per component).
- `custom-field` — attach it to an existing entity bundle.

## 6. Scaffold, build, verify

Write the answers JSON (shape below), then:

    node <drupal-theme-skill>/bin/magoo create-child --answers answers.json --themes-dir web/themes/custom

It installs `magoo_agentic_base_theme` alongside if the site doesn't have it, writes the child, and
vendors a `magoo-components` skill into the child so the next agent can add components without this
repo. Then run exactly what it prints: `composer require` + `drush en` the module dependencies,
`ddev npm install && ddev npm run build:css` in the theme, enable the theme, `drush cim --partial`,
`drush cr`.

**Always verify in a browser** with the `agent-browser` skill before you call it done — a green
build renders nothing.

## Answers JSON

    {
      "machine_name": "acme_theme",
      "name": "Acme Theme",
      "description": "…",
      "purpose": "…",
      "reference": "https://styles.refero.design/style/…",
      "tokens": { "color_primary": "#0447ff", "radius_card": "20px", "font_heading": "\"Waldenburg\", sans-serif" },
      "host_content_type": { "machine": "landing_page", "name": "Landing Page" },
      "components": [{ "id": "marketing/hero-split", "config": "paragraph" }]
    }

`tokens` keys are the token keys in `tokens.manifest.json`. Anything omitted keeps the base default.
```

- [ ] **Step 2: Write `references/design-reference.md`**

```markdown
# Mapping a design reference onto the token contract

## Refero style pages

`https://styles.refero.design/style/<id>` is server-rendered — fetch it and read:

- **Colors** — a neutral ramp plus one or two accents. Map:
  - the page background → `color_background` (and `color_surface` when the reference has no
    separate card color)
  - the darkest neutral → `color_on_background` / `color_on_surface`
  - a mid neutral → `color_on_surface_muted`
  - a light neutral → `color_surface_raised`, the next one up → `color_border`
  - the primary accent (the button color) → `color_primary` + `color_ring`; pick
    `color_primary_contrast` for contrast against it (white on a dark accent, ink on a light one)
  - a second accent, if any → `color_accent`
- **Type** — the display family → `font_heading`, the text family → `font_body`, the code family →
  `font_mono`. Weights → `weight_heading` / `weight_body`. Tracking of the display size →
  `tracking_heading`.
- **Type scale** — take the body size as `text_base`; divide two adjacent steps to get the ratio and
  snap it to the nearest option in `scale_ratio`.
- **Radii** — the input radius → `radius_control`, the button radius → `radius_button` (a fully
  rounded button is `9999px`), the card radius → `radius_card`.
- **Shadows** — copy the card-level and raised-level presets verbatim into `shadow_card` /
  `shadow_raised`; derive `shadow_focus` as a 3px ring in the primary color.
- **Spacing** — a 4px base unit is the default (`density: 0.25rem`). An 8px-base system reads as
  Spacious; a 4px system with tight components reads as Compact.

## A live site

Open it with `agent-browser` and read computed styles from the real DOM — `getComputedStyle` on the
body (background, color, font-family), on a primary button (background, border-radius, color), on a
card (background, border, box-shadow, border-radius), on an h1 (font-family, weight, letter-spacing).
Cluster the colors you collect and map them the same way as above. Say plainly that this is inferred.

## Contrast is not optional

After mapping, check every `*_contrast` pair against its background for WCAG AA (4.5:1 for body
text, 3:1 for large text). If the reference's own pairing fails, keep the reference's hue and adjust
the lightness until it passes, and tell the user you did.

## Dark mode

If the reference only shows a light scheme, derive the dark values rather than asking the user for 22
more colors: invert the neutral ramp (background ↔ darkest neutral), lift the accents' lightness so
they stay visible on a dark ground, and re-check contrast. Set `color_scheme` to `auto` unless the
user said otherwise.
```

- [ ] **Step 3: Point the existing skill at the new one**

In `skills/drupal-theme/SKILL.md`, add right under the title:

```markdown
> **Building a NEW Drupal theme? Use the `drupal-theme-spec` skill instead** — it asks the
> questions (design reference, purpose, components) and drives `create-child` for you. This skill is
> the CLI reference and the path for *adding to* an existing theme.
>
> - `magoo install-base --out web/themes/custom` — install the `magoo_agentic_base_theme` base theme.
> - `magoo create-child --answers a.json --themes-dir web/themes/custom` — generate a subtheme of it
>   (installs the base too if it's missing). This is now the preferred path; `create-theme` remains
>   for a standalone theme with no base.
```

- [ ] **Step 4: Verification gate**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
head -4 skills/drupal-theme-spec/SKILL.md          # frontmatter name/description present
python3 -c "import sys,yaml;yaml.safe_load(open('skills/drupal-theme-spec/SKILL.md').read().split('---')[1])"
```
Expected: no output (valid YAML frontmatter).

---

### Task 6: The demo child theme — ElevenLabs reference, end to end

**Files:**
- Create: `/tmp/claude-*/scratchpad/elevenlabs-answers.json` (scratch, not the repo)
- Create (generated): `custom_theme/web/themes/custom/elevenlabs_theme/`

**Interfaces:**
- Consumes: everything above.

This task **executes the spec-kit skill for real**. Do not hand-write the theme.

- [ ] **Step 1: Ingest the reference**

Fetch `https://styles.refero.design/style/031056ff-7af1-46db-8daa-115f731c5d26` and map it per
`skills/drupal-theme-spec/references/design-reference.md`. Known values from that page (verify them
against the live page, don't trust this list blindly):
ink `#000000`, eggshell `#fdfcfc`, warm taupe `#f5f3f1`, neutrals `#44403b` `#777169` `#a59f97`
`#ebe8e4`, accents `#0447ff` (blue) and `#ff4704` (orange); fonts Waldenburg (display, 300) / Inter
(body, 400–500) / Geist Mono; radii 4px (inputs), 20px (cards), 9999px (buttons/tags); 4px spacing base.

Produce the `token key → value → source` table and show it before writing anything.

- [ ] **Step 2: Choose ≥15 components**

The purpose: a marketing + docs site for an AI audio product. Search the catalog and pick at least
15 — cover navbar, hero, feature grid, pricing, CTA, testimonial, logo cloud, FAQ, footer, an
article/news card + its grid container, a video or audio player (it is an audio product), a stat
band, a newsletter/signup form, and a docs-ish content component. Confirm the list with the user
with a one-line reason each before generating.

- [ ] **Step 3: Write the answers JSON and generate**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui
node scripts/theme-cli.mjs create-child \
  --answers "$SCRATCH/elevenlabs-answers.json" \
  --themes-dir custom_theme/web/themes/custom
```
Expected: `Child theme scaffolded → custom_theme/web/themes/custom/elevenlabs_theme` plus the
next-steps block.

- [ ] **Step 4: Install the module dependencies, build, enable, import**

Run exactly the commands the generator printed, e.g.:
```bash
cd /home/marcus/Documents/Projects/magoocomponentui/custom_theme
ddev composer require drupal/paragraphs drupal/entity_reference_revisions drupal/custom_field
ddev drush en paragraphs entity_reference_revisions custom_field -y
ddev npm install --prefix web/themes/custom/elevenlabs_theme
ddev npm run build:css --prefix web/themes/custom/elevenlabs_theme
ddev drush theme:enable elevenlabs_theme -y
ddev drush config:set system.theme default elevenlabs_theme -y
ddev drush cim --partial --source=/var/www/html/web/themes/custom/elevenlabs_theme/config/install -y
ddev drush cr
```
Expected: every command exits 0; `web/themes/custom/elevenlabs_theme/css/dist/styles.css` is non-empty.

- [ ] **Step 5: Verify in a real browser**

Use the **agent-browser** skill against `https://custom-theme.ddev.site/`:
1. The front page renders in the new theme — background `#fdfcfc`, blue `#0447ff` primary, pill buttons.
2. `/admin/appearance/settings/elevenlabs_theme` shows the inherited token form with the ElevenLabs
   values pre-filled.
3. Change `color_primary` to `#ff4704` in the form, save, reload the front page: the primary color
   changes **without** re-running the CSS build. This is the single most important thing to prove.
   Change it back.
4. Create a `landing_page` node, stack 3–4 of the generated paragraph components, and screenshot it.
5. Read every screenshot. Fix what looks broken (a component whose classes didn't compile means the
   Tailwind `@source` globs are wrong — check `css/src/styles.css`).

- [ ] **Step 6: Verification gate**

```bash
curl -sk https://custom-theme.ddev.site/ | grep -c 'data-magoo-tokens'   # → 1
cd /home/marcus/Documents/Projects/magoocomponentui && pnpm test 2>&1 | tail -3
```
Report what rendered, with the screenshots. Do not claim success on a green build alone.

---

### Task 7: Documentation

**Files:**
- Modify: `CLAUDE.md` (a "Base theme + child themes" section)
- Modify: `.agents/progress.md`
- Modify: `.agents/decisions.md` (record the settings-inheritance branch taken in Task 2 Step 10)
- Create: `docs/base-theme.md`

- [ ] **Step 1: Write `docs/base-theme.md`**

Cover: the runtime-CSS-variable mechanism (why Tailwind doesn't block a settings form, and the one
thing it does block — new classes need a rebuild); the token manifest as the single source of truth
for the PHP form, the runtime CSS, and the generator; the region list; the base/child split; the
`install-base` and `create-child` commands; and the rule that styling is tokens + props, never CSS.

- [ ] **Step 2: Add to `CLAUDE.md`**

A short section under "Theme generator" pointing at `docs/base-theme.md`, the two new subcommands,
the `drupal-theme-spec` skill, and the invariant: **edit `skills/drupal-theme/base-theme/`, not the
copy under `custom_theme/web/themes/custom/`** — the latter is a deployment.

- [ ] **Step 3: Update `.agents/progress.md`** with what shipped and what the demo theme proved.

- [ ] **Step 4: Verification gate**

```bash
cd /home/marcus/Documents/Projects/magoocomponentui && pnpm test 2>&1 | tail -3
```
Expected: all green. **Do not commit** — the user is setting up git inside the base theme themselves.

---

## Self-review

**Spec coverage:** base theme + 22 regions (Task 2) · full grouped settings form incl. dark mode,
layout/density, region visibility, branding/font source, advanced escape hatch (Tasks 1–2) · child
compiles its own CSS with the skill documenting how (Task 4 `css/src/styles.css` + vendored SKILL.md)
· child-theme generator (Task 4) · vendored agent skills in the child (Task 4) · spec-kit skill with
all four reference modes + interrogation fallback (Task 5) · ≥15 components styled by tokens + props
(Tasks 5–6) · demo child installed and verified on the DDEV site (Task 6). All covered.

**Placeholders:** none — every step has real code or a real command.

**Type consistency:** `loadManifest`/`tokenList`/`defaultSettings`/`settingsFromTokens`/`settingsYaml`/
`BASE_MACHINE`/`BASE_THEME_DIR` (Task 1) are used with the same names in Tasks 3–4.
`installBaseTheme(themesDir)` (Task 3) is called by `runCreateChild` (Task 4). Setting names are
`magoo_<token key>` and dark variants `magoo_<token key>_dark` in both the PHP (`magoo_tokens_defaults`)
and the JS (`settingName`).

**Known risk, handled:** base-theme `theme-settings.php` inheritance is proven by a spike (Task 2
Step 10) with a written fallback before Task 4 relies on it.

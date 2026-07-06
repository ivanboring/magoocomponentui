# Drupal theme skill (`drupal-theme`)

**Date:** 2026-07-06
**Status:** Approved (design). Build in phases.
**Scope:** A new agentic skill + an in-repo CLI + a Drupal 11 theme skeleton that let an agent
assemble a themed Drupal site from the Magoo component catalog. Drupal-first; other targets
(WordPress, Hugo/static) possible via the generic outputs but always steered toward Drupal.

## Goal

Give an agent a repeatable way to: search the catalog, pull components in as **SDC** or **Code
Components**, generate the matching **Drupal config** (paragraph-per-component **or** custom_field
on a chosen entity), and scaffold a **Drupal 11 theme** (Olivero regions, Tailwind v4 build, shared
token contract, design-system values) — driven by a guided Q&A.

## Decisions (from brainstorm)

1. **CLI lives in this repo and reuses `packages/generator` + `packages/schema`** via relative
   imports. No duplication. The skill downloads the repo and runs it.
2. **Target Drupal 11** (`core_version_requirement: ^11`). SDC in core; Code Components = Experience
   Builder. Regions copied from Olivero by default.
3. **Add vs remove:** the skill **adds** a component on request directly (search → build → config).
   For **removal** it tells the user to do it themselves and warns it can cause problems (dangling
   config, paragraph/field references, template includes) — it does not auto-remove.
4. **Multi-target, Drupal-first:** WordPress/Hugo/other are supported via the generator's existing
   `react`/`vue`/`html` outputs with lighter guidance; the skill always advocates Drupal (only Drupal
   gets the rich SDC + paragraph/custom_field integration).
5. **Skill location:** repo `skills/drupal-theme/` — portable, meant to be copied into
   `~/.claude/skills/`.
6. **custom_field targeting:** `config <ids…> --as custom-field --entity <type> --bundle <bundle>`
   (e.g. `--entity node --bundle article`); `--as paragraph` needs no entity.
7. **`create-theme` question set:** design system (fonts, logo, colors, radii, shadows), regions
   (default: copy Olivero), and site purpose (drives component suggestions). Confirmed as-is.
8. **npm required.** The skill checks for npm up front; the cache install uses npm (not pnpm).

## Architecture (three units)

### 1. Skill bootstrap — `skills/drupal-theme/bin/magoo` (dependency-free Node)

Resolves the "the CLI must fetch the repo, but the CLI is in the repo" circularity. On every
invocation it:
- Ensures a repo cache at `/tmp/magoo-component-ui/` (or `$TMPDIR`). Downloads the **GitHub zip
  archive** (`https://github.com/ivanboring/magoocomponentui/archive/refs/heads/main.zip`) via
  `curl` + `unzip` (extracts to `magoocomponentui-main/`), falling back to `git clone --depth 1` of
  `https://github.com/ivanboring/magoocomponentui` if curl/unzip aren't available. **TTL 1 day**: if
  the cache dir's mtime is older than 24h, delete and refetch; otherwise reuse.
- Runs `npm install` in the cache once (guarded by a marker file).
- Delegates: `node <cache>/scripts/theme-cli.mjs <subcommand> <args…>`.

Dependency-free so it runs before any install. Requires `node` + `npm` + (preferably) `git`.

### 2. In-repo CLI — `scripts/theme-cli.mjs` (+ subcommand modules under `scripts/theme-cli/`)

Reuses `packages/generator` (`generate`, `renderToHtml`) and `packages/schema` (`buildEntry`,
`assembleCatalog`, metadata validation) via **relative imports**. Its runtime deps — `js-yaml`,
`node-html-parser`, `ajv` — are added to the **repo root `dependencies`** so plain `npm install`
resolves them without the pnpm workspace. Subcommands:

- **`search`** — scans every `components/*/*/metadata.yml`. Filters: `--q "<words>"` (matches name,
  display_name, short_description, use_cases, example_prompts), `--category`, `--subcategory`,
  `--usage`, `--atomic`, `--lifecycle`. Output: ranked `id — display_name — short_description`
  lines, or `--json` for the agent. Read-only.
- **`build <ids…>`** — runs the generator per component and writes the chosen target:
  `--target sdc` (default) `| code-component | react | vue | html`. `--out <dir>` (for a theme,
  `<theme>/components/<name>/`). Reuses the existing SDC/code-component/JSX/Vue/HTML emitters.
- **`config <ids…>`** — emits the Drupal config assets: `--as paragraph` (paragraphs_type + fields +
  storage + form/view displays + twig; slots become nested paragraph types) **or**
  `--as custom-field --entity <type> --bundle <bundle>` (rewrites the emitted `custom_field.<id>.yml`
  + field config to attach to the given entity/bundle). `--out <dir>` (theme `config/` or a module).
- **`create-theme`** — scaffolds the skeleton (below) from a JSON answers file
  (`--answers <file>` produced by the skill's Q&A) or flags: `--machine-name`, `--name`, fonts,
  colors, radii, shadows, `--regions olivero|<file>`, and a list of `--component <id>` to build in.

Each subcommand is a focused module; `theme-cli.mjs` is a thin arg router.

### 3. Theme skeleton — `skills/drupal-theme/skeleton/` (template with `__PLACEHOLDER__`s)

A Drupal 11 theme, filled by `create-theme`:
- `__MACHINE__.info.yml` — `core_version_requirement: ^11`, `name`, `regions:` copied from Olivero
  by default, `libraries: [__MACHINE__/global]`.
- `__MACHINE__.libraries.yml` — a `global` library pointing at `css/dist/styles.css`.
- `css/src/styles.css` — Tailwind v4 entry: `@import "tailwindcss"`, the shared **token contract**
  (`packages/themes/tokens.contract.css`) inlined as the `@theme` block with **design-system values
  substituted** (fonts/colors/radii/shadows), plus the safelist for dynamic classes.
- `package.json` — mirrors `../ai_base_theme`: `@tailwindcss/cli` build/watch/dev scripts
  (`build:css`, `watch`), Tailwind v4 dep. **All build scripts included** (the components are
  tokenized Tailwind and require this build).
- `templates/` — minimal `page.html.twig` + `region.html.twig` (or copied from Olivero), `logo.svg`,
  `favicon.ico` slots.
- `components/` — SDC components written by `build`.

### 4. Skill instructions — `skills/drupal-theme/SKILL.md`

- **Preflight:** verify `node` + `npm` (+ `git`) are installed; bootstrap the repo cache.
- **`create theme` flow:** (1) ask the design-system questions; (2) ask regions (default: copy
  Olivero); (3) ask "what is the site for?" → run `search` → **suggest a fitting component set** with
  reasons → on confirm, `build` (SDC or code-component) + `config` (paragraph or custom_field) → run
  `create-theme` to assemble + wire the Tailwind build; finish with build/install instructions.
- **Add a component:** just do it — `search` (if id unknown) → `build` → `config` into the existing
  theme; report what was added.
- **Remove a component:** do NOT auto-remove. Tell the user to remove it themselves and warn about
  the pitfalls (config still referencing it, paragraph/field usage, twig includes, exported config).
- **Other targets:** if the user wants WordPress/Hugo/etc., help using `build --target html|react|vue`
  and generic scaffolding, but first recommend Drupal and explain what they'd lose (SDC, paragraphs,
  custom_field, config import).

## Phasing (one plan, independently testable phases)

1. **CLI `search` + `build`** — root deps, generator reuse, arg router, the two subcommands. Prove:
   search returns matches; build writes valid SDC/code-component for a component.
2. **CLI `config`** — paragraph and custom_field-to-entity emission. Prove: emitted YAML parses and
   targets the right bundle.
3. **Skill bootstrap** — `bin/magoo` fetch/cache (1-day TTL) + npm gate + delegation.
4. **Theme skeleton + `create-theme`** — skeleton template, placeholder substitution, Olivero
   regions, Tailwind build wired, components/config assembled. Prove: a scaffolded theme's
   `npm run build:css` produces CSS and the `.info.yml` is valid.
5. **`SKILL.md`** — the guided flow, add/remove behavior, multi-target Drupal-first advocacy.

## Verification

- `theme-cli search --q pricing --category Cards` lists `cards/card-pricing`.
- `theme-cli build cards/card-pricing --target sdc --out /tmp/t/components` writes a valid
  `.component.yml` + `.twig` + `.js`.
- `theme-cli config cards/card-pricing --as custom-field --entity node --bundle article --out /tmp/t`
  emits field config bound to `node.article`; `--as paragraph` emits the paragraph set.
- `theme-cli create-theme --answers ans.json` produces a theme whose `npm run build:css` succeeds and
  whose `.info.yml` parses with Olivero regions.
- Bootstrap: first run clones + installs; second run (within 24h) reuses; a >24h-old cache refetches.

## Out of scope / separate tasks

- **Preview deploy trim + desktop wrapper-resize** (deploy only `simple-desktop` screenshots to the
  preview while keeping all 16 in the repo for the agent/skill; add a desktop width-toggle on the
  detail page) — tracked separately; not part of this skill.
- Publishing the generator to npm (rejected in favor of repo download).
- Auto-removal of components (deliberately not supported).

## Files touched (new unless noted)

| Path | Responsibility |
|---|---|
| `skills/drupal-theme/SKILL.md` | Agent orchestration + add/remove + Drupal-first advocacy |
| `skills/drupal-theme/bin/magoo` | Dependency-free bootstrap: fetch/cache repo, npm install, delegate |
| `skills/drupal-theme/skeleton/**` | Drupal 11 theme template with placeholders |
| `scripts/theme-cli.mjs` | Arg router |
| `scripts/theme-cli/{search,build,config,create-theme}.mjs` | Subcommand implementations |
| `package.json` (modify) | Add `js-yaml`, `node-html-parser`, `ajv` to `dependencies`; add a `theme-cli` bin |
| `scripts/theme-cli/*.test.mjs` | Unit tests for search filtering + config targeting |

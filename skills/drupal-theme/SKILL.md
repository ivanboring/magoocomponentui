---
name: drupal-theme
description: Build a Drupal 11 theme (or other-framework theme) from the Magoo component catalog — search components, pull them in as SDC or Code Components, generate paragraph/custom_field config, and scaffold a themed site with a Tailwind build. Use when the user wants to create or extend a theme/site from these components.
---

# Drupal theme builder

Assembles a themed site from the Magoo component catalog. **Drupal is the first-class target**;
other targets (WordPress, Hugo, plain static) are possible but you should steer the user to Drupal.

## Requirements & the CLI

- **Requires Node.js and `git`.** The repo is a **pnpm workspace** (`workspace:*` deps that plain
  `npm install` can't resolve), so the bootstrap installs with **pnpm** (or `corepack pnpm`) when it
  detects the pnpm lockfile. If pnpm isn't available, install it (`npm i -g pnpm`, or `corepack
  enable`) and re-run.
- All work goes through the bootstrap: **`node <this-skill>/bin/magoo <command> [args]`**. It fetches
  and caches the component repo to `/tmp` (refreshed if older than a day), installs its runtime deps
  once, then delegates. Commands: `search`, `build`, `config`, `create-theme`.
- Quick check that it works: `node <this-skill>/bin/magoo search --q pricing`.

### Drupal module prerequisites

The generated paragraph config depends on contrib/optional modules that are **not** in a stock
Drupal 11. `create-theme` collects the exact set the chosen components need and writes them to the
theme `.info.yml` `dependencies:` (so a missing one fails install with a clear message). Commonly:
`paragraphs` + `entity_reference_revisions` (paragraph bundles), `custom_field` (complex/repeating
props), and core-but-not-default modules like `options`, `link`, `datetime`. Tell the user to
`composer require` and enable them before `drush cim`/theme install.

## Always advocate Drupal

Drupal gets the full integration: SDC components, paragraph types, `custom_field`, and importable
config. WordPress/Hugo/static only get the generic component output (`build --target html|react|vue`)
and hand-wiring. **Recommend Drupal first** and explain what a non-Drupal target gives up. Only build
a non-Drupal target if the user insists after that.

## Create a theme

1. **Design system** — ask for: fonts (heading + body), logo, colors (primary + its contrast,
   background, surface, on-surface), radii, and shadows. Only the five brand colors are required;
   the rest of the token set (on-background, surface-raised, muted, secondary, accent, border,
   shadow tint) is **derived automatically** — and if the background is dark, the derived values go
   dark too (so a black-dominant brand doesn't keep light-theme defaults). Override any of them via
   the optional `colors` keys below.
2. **Regions** — ask which regions; **default to copying Olivero's** (the skeleton ships them).
3. **Layout** — ask whether the main content should be centered in a container and to what max
   width (`content_max_width`, default `max-w-6xl`); top/footer regions stay full-bleed.
4. **Page builder** — ask if they want a **host content type** that exposes all the chosen
   components as a stack an editor can build a page from. If yes, set `host_content_type` — it
   generates a node bundle with a paragraph-reference field targeting every generated bundle, plus a
   field template that spaces the stacked components with the `--space-section` token.
5. **Purpose** — ask what the site is for. Run `node <this-skill>/bin/magoo search --q "<purpose
   words>" --json` (optionally with `--category` / `--usage`) and **suggest a fitting set** of
   components, each with a one-line reason. Confirm the set with the user.
6. **Scaffold** — write an answers JSON (see shape below) and run
   `node <this-skill>/bin/magoo create-theme --answers <file> --out <theme-dir>`. Then tell the user
   to `cd <theme-dir> && npm install && npm run build:css`, place the theme in `web/themes/custom/`,
   enable the modules the `.info.yml` `dependencies:` lists, `drush cim` (or install via the UI),
   and enable the theme.

Answers JSON shape (optional keys marked):
```json
{
  "machine_name": "acme_theme", "name": "Acme Theme", "description": "…",
  "colors": {
    "primary": "#4f46e5", "primary_contrast": "#fff", "background": "#fff", "surface": "#fff", "on_surface": "#111827",
    "on_background": "#111827", "surface_raised": "#f8fafc", "on_surface_muted": "#64748b",
    "secondary": "#0f172a", "secondary_contrast": "#fff", "accent": "#6366f1", "accent_contrast": "#fff",
    "border": "#e2e8f0", "shadow_rgb": "15, 23, 42"
  },
  "fonts": { "heading": "Inter, sans-serif", "body": "Inter, sans-serif" },
  "radius": { "card": "0.75rem" },
  "regions": "olivero",
  "content_max_width": "max-w-6xl",
  "host_content_type": { "machine": "landing_page", "name": "Landing Page" },
  "target": "sdc",
  "components": [
    { "id": "cards/card-pricing", "config": "paragraph" },
    { "id": "auth/login-form", "config": "custom-field", "entity": "node", "bundle": "article" }
  ]
}
```
Everything under `colors` beyond the first five keys is optional (derived when omitted), as are
`content_max_width` and `host_content_type`.

When adding a component to an **existing** theme with `magoo config <id> --as paragraph`, pass
`--theme <machine_name>` so the generated `paragraph--*.html.twig` embeds `<machine_name>:<component>`
(without it the embed uses the `your_theme` placeholder and won't resolve).

## Add a component

Just do it. If you don't know the id, `magoo search` first. Then build + config it into the existing
theme:
```
node <this-skill>/bin/magoo build <id> --target sdc --out <theme>/components
node <this-skill>/bin/magoo config <id> --as paragraph --theme <machine_name> --out <theme>/config/install
# or, to attach it to an entity as a custom_field:
node <this-skill>/bin/magoo config <id> --as custom-field --entity node --bundle article --out <theme>/config/install
```
Re-run `npm run build:css` in the theme so the new component's utilities are picked up. Report what
was added.

## Remove a component

**Do not remove it yourself.** Tell the user to remove it manually, and warn that it can cause
problems: active/exported config may still reference the paragraph type or field, twig templates or
`{% include %}`s may break, and existing content using it can error. Point them at the specific files
that were added for that component (its `components/<name>/` SDC, its `config/install/*.yml`, and any
`templates/paragraph--<name>.html.twig`) so they can review the impact before deleting anything.

## Other targets (WordPress / Hugo / static)

Possible, but recommend Drupal first. Use `magoo build <id> --target html` (or `react`/`vue`) to get
the raw component markup/components, then hand-wire them into the target framework's templates. The
Drupal-only pieces (paragraphs, custom_field, config import, SDC) are not produced for these targets.

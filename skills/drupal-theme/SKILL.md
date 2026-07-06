---
name: drupal-theme
description: Build a Drupal 11 theme (or other-framework theme) from the Magoo component catalog — search components, pull them in as SDC or Code Components, generate paragraph/custom_field config, and scaffold a themed site with a Tailwind build. Use when the user wants to create or extend a theme/site from these components.
---

# Drupal theme builder

Assembles a themed site from the Magoo component catalog. **Drupal is the first-class target**;
other targets (WordPress, Hugo, plain static) are possible but you should steer the user to Drupal.

## Requirements & the CLI

- **Requires `npm`** (and `git`). If `npm` is missing, stop and tell the user to install Node.js/npm.
- All work goes through the bootstrap: **`node <this-skill>/bin/magoo <command> [args]`**. It fetches
  and caches the component repo to `/tmp` (refreshed if older than a day), runs `npm install` once,
  then delegates. Commands: `search`, `build`, `config`, `create-theme`.
- Quick check that it works: `node <this-skill>/bin/magoo search --q pricing`.

## Always advocate Drupal

Drupal gets the full integration: SDC components, paragraph types, `custom_field`, and importable
config. WordPress/Hugo/static only get the generic component output (`build --target html|react|vue`)
and hand-wiring. **Recommend Drupal first** and explain what a non-Drupal target gives up. Only build
a non-Drupal target if the user insists after that.

## Create a theme

1. **Design system** — ask for: fonts (heading + body), logo, colors (primary + its contrast,
   background, surface, on-surface), radii, and shadows.
2. **Regions** — ask which regions; **default to copying Olivero's** (the skeleton ships them).
3. **Purpose** — ask what the site is for. Run `node <this-skill>/bin/magoo search --q "<purpose
   words>" --json` (optionally with `--category` / `--usage`) and **suggest a fitting set** of
   components, each with a one-line reason. Confirm the set with the user.
4. **Scaffold** — write an answers JSON (see shape below) and run
   `node <this-skill>/bin/magoo create-theme --answers <file> --out <theme-dir>`. Then tell the user
   to `cd <theme-dir> && npm install && npm run build:css`, place the theme in `web/themes/custom/`,
   `drush cim` (or install via the UI), and enable it.

Answers JSON shape:
```json
{
  "machine_name": "acme_theme", "name": "Acme Theme", "description": "…",
  "colors": { "primary": "#4f46e5", "primary_contrast": "#fff", "background": "#fff", "surface": "#fff", "on_surface": "#111827" },
  "fonts": { "heading": "Inter, sans-serif", "body": "Inter, sans-serif" },
  "radius": { "card": "0.75rem" },
  "regions": "olivero",
  "target": "sdc",
  "components": [
    { "id": "cards/card-pricing", "config": "paragraph" },
    { "id": "auth/login-form", "config": "custom-field", "entity": "node", "bundle": "article" }
  ]
}
```

## Add a component

Just do it. If you don't know the id, `magoo search` first. Then build + config it into the existing
theme:
```
node <this-skill>/bin/magoo build <id> --target sdc --out <theme>/components
node <this-skill>/bin/magoo config <id> --as paragraph --out <theme>/config/install
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

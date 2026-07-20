# Magoo Agentic Base Theme — design

**Date:** 2026-07-14
**Status:** approved (design), pending implementation plan

## Problem

The `drupal-theme` skill + `theme-cli create-theme` today emit a **standalone** Drupal theme
(`base theme: false`) whose design-token values are **baked into Tailwind's `@theme` block at build
time**. Consequences:

- No Drupal theme-settings surface — changing a color means editing CSS and rebuilding.
- Every generated theme is a sibling; there is no shared base to inherit regions, templates,
  the SDC/behavior runtime, or a settings form from.
- A theme carries no agent tooling, so an agent working in the *target* Drupal site cannot search or
  install catalog components without the component repo checked out separately.
- There is no guided path from "here is a design I like" to "here is a themed site using the right
  components".

## Goal

Ship a **base theme** (`magoo_agentic_base_theme`) installed in the real Drupal 11 site at
`custom_theme/web/themes/custom/`, a **child-theme generator**, and a **spec-kit skill** that turns a
design reference plus a purpose into a styled child theme with 15+ catalog components — then prove
the loop end to end on `https://custom-theme.ddev.site/`.

## Key insight: Tailwind v4 tokens are runtime-settable

Tailwind v4 compiles a `@theme` entry to a utility that **references the variable**, not the value:

```css
@theme { --color-primary: #4f46e5; }
/* emits */
:root { --color-primary: #4f46e5; }
.bg-primary { background-color: var(--color-primary); }
```

So a later `:root { --color-primary: … }` rule — written by Drupal from theme settings — restyles
every component with **no rebuild**. This is what makes a large settings form possible despite
Tailwind, and it is the load-bearing fact of the whole design.

Two further levers, beyond the named contract tokens:

- **`--spacing`** — Tailwind's base spacing unit. `p-4` is `calc(var(--spacing) * 4)`, so one
  setting rescales padding/gap/margin across *all* components (the "density" control).
- **`--text-*`** — the type scale. A base size + scale ratio setting moves all component type.

What Tailwind **cannot** do at runtime is emit a utility class it never saw at build time. Hence the
build strategy below.

## Layers

| Layer | Owns |
|---|---|
| **Token contract** | The fixed CSS-variable names (`packages/themes/tokens.contract.css`). Never renamed, never extended per theme. |
| **Base theme** `magoo_agentic_base_theme` | Regions, templates, SDC + behavior runtime, the settings form, and the runtime `:root` emission. Installed once. |
| **Child theme** | Brand values (`<child>.settings.yml`), its installed components, and **its own Tailwind build**. |

### Build strategy (decided)

**The child theme compiles its own CSS.** Its Tailwind entry `@source`s both the base theme's
templates and its own `components/**`, so only the classes actually in use are emitted. The build is
run *inside DDEV* and **the skill documents it**:

```
ddev npm install --prefix web/themes/custom/<child>
ddev npm run build:css --prefix web/themes/custom/<child>   # re-run after EVERY component add
```

The base theme ships a small **prebuilt** `css/dist/base.css` (compiled from its own templates only)
so it is installable and usable standalone; the child adds its own `css/dist/styles.css` on top.
Both emit the same contract defaults, and both are overridden at runtime by the inline `:root` block,
so the overlap is inert.

## Base theme: `magoo_agentic_base_theme`

```
custom_theme/web/themes/custom/magoo_agentic_base_theme/
  magoo_agentic_base_theme.info.yml        # regions + `settings:` defaults (inherited by children)
  magoo_agentic_base_theme.libraries.yml
  magoo_agentic_base_theme.theme           # preprocess: emit :root vars, region visibility, font links
  theme-settings.php                  # the settings form (inherited by every child)
  includes/tokens.php                 # settings -> CSS-variable map + derivation + dark-mode derive
  templates/                          # html, page, region, block, node, field, menu
  css/src/contract.css                # the @theme contract, importable by a child's Tailwind entry
  css/dist/base.css                   # prebuilt (base templates only)
  js/                                 # SDC behavior runtime, color-scheme toggle
  config/install/magoo_agentic_base_theme.settings.yml
```

**Regions (~22)** — a superset, so a child can hide what it doesn't want rather than edit Twig:
`header_top`, `header`, `primary_menu`, `secondary_menu`, `search`, `breadcrumb`, `highlighted`,
`hero`, `hero_secondary`, `content_above`, `content_top`, `content`, `content_bottom`,
`content_below`, `sidebar_first`, `sidebar_second`, `pre_footer`, `footer_top`, `footer_columns`,
`footer_bottom`, `page_bottom`, `page_top`.

**Settings form** — vertical tabs, all values written as CSS variables at runtime:

- **Brand** — 5 required colors (primary, primary-contrast, background, surface, on-surface);
  everything else derived (secondary, accent, borders, muted, surface-raised, shadow tint), dark-aware.
- **Colors** — every contract color individually overridable, each with a dark-mode counterpart.
- **Typography** — heading/body/mono family, weights, tracking, base size, scale ratio; font source:
  Google · Bunny · self-hosted · none.
- **Shape** — `--radius-{control,button,card,pill}`.
- **Elevation** — `--shadow-{card,raised,focus}` + tint RGB.
- **Spacing** — density (`--spacing`: compact/comfortable/spacious), `--space-{section,card,control}`,
  container max-width.
- **Motion** — `--duration-token`, `--ease-token`.
- **Layout** — sidebar first/last, sticky header, per-region visibility and full-bleed vs. contained.
- **Branding & meta** — logo/favicon (core), footer text.
- **Advanced** — raw CSS-variable escape hatch (appended last, wins).

**Dark mode** — a second value set per color token, emitted under both
`@media (prefers-color-scheme: dark)` and `[data-color-scheme="dark"]`, with an optional header toggle.

**Inheritance** — Drupal includes a base theme's `theme-settings.php` and its `.info.yml` `settings:`
defaults when building a subtheme's settings form, so every child gets the full form and the full
default token set without duplicating anything. (To be verified in implementation; if a Drupal
version quirk breaks it, fall back to the child's generated `.info.yml` restating `settings:`.)

## Child-theme generator: `magoo create-child`

New `scripts/theme-cli/create-child.mjs` (+ subcommand in `theme-cli.mjs`), reusing
`packages/generator` like the existing commands. From an answers JSON it emits:

- `<child>.info.yml` with `base theme: magoo_agentic_base_theme` and the module dependencies its
  components need.
- `<child>.settings.yml` — the token values resolved from the design reference.
- `package.json` + `css/src/styles.css` (Tailwind entry importing the base contract, `@source`ing the
  base templates and `./components/**`).
- The chosen components as **SDC** under `components/`, plus their `config/install/` paragraph/node/
  custom-field config, and an optional page-builder host content type.
- **Vendored agent tooling inside the theme**: `.claude/skills/magoo-components/SKILL.md`,
  `bin/magoo` (the existing bootstrap), and a `CLAUDE.md` pointing at them — so the theme is portable
  and any agent in the target site can search/add components. The generator also appends a pointer
  line to the site's `AGENTS.md`/`CLAUDE.md`.

`create-theme` (standalone) stays as-is for non-Drupal/no-base use; `create-child` is the new default
path for Drupal.

## Spec-kit skill: `drupal-theme-spec`

A questionnaire that runs until it can fill the contract *and* choose components.

1. **Design reference** — any of:
   - **Refero style URL** (`styles.refero.design/style/<id>`) — server-rendered and fully tokenized;
     fetch it, parse palette (hex), font families + weights, the type scale, spacing values, named
     radii and shadow presets, map them onto the contract, and **show the mapping for approval**.
   - **Any live site URL** — open with agent-browser, extract computed colors/fonts/radii, cluster
     into a palette.
   - **Screenshot / image** — extract palette and read the type visually.
   - **Description only** — compose a token set using the `frontend-design` skill.
   - **No usable pointer → interrogate**: brand, mood, audience, light/dark, density, type feel —
     keep asking until the contract can be filled.
2. **Purpose** — what the theme is for: audience, content types, page types.
3. **Components** — `magoo search` against the purpose, then **propose at least 15** (more when the
   purpose warrants) each with a one-line reason; confirm the set with the user.
4. **Styling depth (decided)** — **token values + variant/prop choices only**. The reference sets the
   tokens; per component the skill picks the fitting enum variants/props and curated default content.
   No override CSS layer, no forked Twig — restyling later stays a settings change and components keep
   tracking the catalog.
5. **Structure** — regions preset, container width, density, page-builder host type, and each
   component's config mode (paragraph / node / custom-field).
6. **Emit + build + verify** — write the answers JSON, run `magoo create-child`, run the CSS build in
   DDEV, `drush cim` + enable, and check it in a browser.

## Proof (this pass)

Use the skill for real against the site the user provided:

- Reference: `https://styles.refero.design/style/031056ff-7af1-46db-8daa-115f731c5d26` (ElevenLabs).
- Generate a child theme with 15+ components, install base + child in
  `custom_theme/web/themes/custom/`, enable, build CSS, and verify rendering at
  `https://custom-theme.ddev.site/` (admin/admin) with agent-browser.

## Non-goals

- Removing components from a theme (still manual, per the existing skill).
- Per-component settings groups in the form (the form would explode; variants/props already cover it).
- A component-override CSS layer or forked component Twig in child themes.
- Non-Drupal targets beyond what `build --target html|react|vue` already gives.

## Testing

- Unit tests for `create-child.mjs` (answers → file set, dependency collection, settings YAML) beside
  the existing `scripts/theme-cli/*.test.mjs`, run by `pnpm test`.
- Unit test for the token derivation map (settings → CSS variables, incl. dark derivation).
- End-to-end: the demo child theme installs, builds, and renders in the DDEV site — verified in a
  browser, not just by a green build.

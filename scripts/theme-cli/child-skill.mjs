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

   **Drupal Canvas?** If this site uses the \`canvas\` module, a component can instead be wired to
   content by Canvas: run only the \`build\` line above (the SDC) and **skip \`config\` entirely** —
   Canvas auto-discovers the SDC on \`drush cr\` and derives its own
   \`canvas.component.sdc.${machine}.<name>\` entity (no paragraph type, no fields, no Twig embed).
   It works only if every prop shape maps to a Drupal field: **an array-of-object prop (any
   \`data-for\` list component) is NOT Canvas-eligible** — check first, and use \`--as paragraph\` for
   the rest:
   \`\`\`
   node .claude/skills/magoo-components/bin/magoo canvas-check <id>
   \`\`\`
   Modes mix freely: Canvas for composable page components, paragraphs for the list-shaped ones.
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
using the paragraph type. Uninstall the paragraph type before deleting its config. A Canvas-wired
component leaves a \`canvas.component.sdc.${machine}.<name>\` config entity behind after the SDC is
deleted (Canvas keeps it so existing pages don't break) — delete that, and any now-empty
\`canvas.folder.*\`, by hand too.
`;
}

/** @param {string} machine @param {string} name */
export function childClaudeMd(machine, name) {
  return `# ${name} (\`${machine}\`)

A Drupal subtheme of \`magoo_agentic_base_theme\`, built from the Magoo component catalog.

> **Build the CSS before you enable this theme.** \`${machine}.libraries.yml\` links
> \`css/dist/styles.css\`, which is NOT committed — it is produced by Tailwind. Enabling the theme
> first gives every page a broken (404) stylesheet link and unstyled components. Run
> \`npm install && npm run build:css\` (or \`ddev npm install && ddev npm run build:css\`) in this
> directory first, then \`drush theme:enable ${machine}\`.

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

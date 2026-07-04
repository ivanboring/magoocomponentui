# Progress

## Done
- **Brainstormed + approved design.** Full spec at `~/.claude/plans/i-want-to-create-frolicking-walrus.md`.
- **Researched** Drupal SDC (props/slots schema, twig `{{ slot }}`), Code Components (Preact), custom_field. See `references.md`.
- **Studied reference theme** `../ai_base_theme/components` — extracted SDC output shape, portable JS pattern, `__hook` class convention, slot composition, dynamic-class safelisting. See `references.md`.
- **Authored first 200 components** → `docs/catalog/first-200.md` (Sports/World Cup, Video, Notifications covered deeply; 9-component proof set identified).
- **Wrote project `CLAUDE.md`** (durable design + conventions + token contract + references).
- **Locked shared token-contract** requirement: identical CSS-variable names across all four themes; only values differ.
- Toolchain: Node 24, pnpm 11 (via corepack). Project is greenfield (no scaffold yet).

## Next (build order — tracked in the task list)
1. ✅ Scaffolded monorepo (pnpm workspaces, Node ESM + JSDoc, root config). `@magoo/themes`: `tokens.contract.css` (shared contract) + 4 value sets (simple/futuristic/classic/smooth) + `index.css` (Tailwind v4 + safelist + theme base). Designed with frontend-design skill.
2. ✅ `@magoo/generator`: `parser.js` (template.html → AST: element/text/slot + `{{ }}`/`{{{ }}}`/`data-if`/`data-for`) and `def.js` (component.def.yml normalizer). 9 unit tests pass (`pnpm test`).
3. ✅ `@magoo/schema`: metadata JSON Schema + ajv validator + catalog builder (`dist/catalog.json`). 6 tests.
4. ✅ Emitters (all in `@magoo/generator`, 18 tests): reference AST→HTML renderer, SDC (component.yml+twig+js), Preact code component, React, Vue, Storybook. Portable self-init behavior wrapper.
5. ✅ Drupal emitter: `fields.yml` + `paragraph--<name>.html.twig` + inferred `custom_field` columns. `docs/drupal-mapping.md`.
   Build pipeline: `scripts/build.mjs` (generate → `dist/<id>/`) + `scripts/build-catalog.mjs`. `pnpm build` runs both. MIT licensed.

### STRUCTURE — COMPLETE ✅
- ✅ variant→class mapping (`variants:` + `{{ prop@class }}`) across all targets.
- ✅ Storybook (`.storybook/`) — HTML renderer, theme toolbar, web fonts; `storybook build` green.
- ✅ Astro static preview — top search + category dropdown, live theme switch, screenshot grid, props/slots + metadata.
- ✅ Playwright screenshot pipeline (`scripts/screenshot.mjs`) — 16/component; catalog auto-detects them.
- ✅ Docs: authoring-guide, template-directives, metadata-schema, theming, taxonomy, drupal-mapping, README, spec copy.
- ✅ Reference component `notifications/alert` (variants + JS + slot + 16 screenshots) — kept as the worked example.
- Verified: `pnpm test` (31), `pnpm build`, `pnpm preview:build`, `pnpm storybook:build`, `pnpm screenshots` all green.

### PAUSE POINT — hand off to another model for component authoring
Structure is done. **Authoring the 218-component catalog is deferred to another model/session** per the user. To add a component: create `components/<category>/<name>/` with `component.def.yml` + `template.html` + `metadata.yml` (+ optional `behavior.js` / `examples/`), then `pnpm build`. Copy `components/notifications/alert/` as the template. Read `docs/authoring-guide.md`, `docs/template-directives.md`, `docs/theming.md`.

## Resolved with user
- **Build order: breadth-first** — early wave takes a few from each domain for preview variety, then depth.
- **Added Dashboard domain** (18 components, #201–218) → catalog now 218.
- **Granularity: keep concepts separate** (e.g. `card-movie` vs `card-tv-show` are distinct components).

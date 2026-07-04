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
1. Scaffold monorepo (pnpm workspaces, TS, Tailwind v4, `packages/themes/tokens.contract.css` + 4 value sets).
2. `component.def.yml` shape + template directive parser (AST) + tests.
3. Metadata JSON Schema + ajv validator + catalog builder → `dist/catalog.json`.
4. Generator emitters: SDC → Code Component → React → Vue → Storybook.
5. Drupal paragraph + custom_field scaffolding + mapping docs.
6. Author the 9 proof-set components (source only).
7. Full build pipeline + Storybook wiring.
8. Astro static preview site (nav, Fuse.js search, screenshot grid, theme switch).
9. Playwright screenshot pipeline (16/component).
10. Docs + spec copy + end-to-end verification.

## Awaiting user input
- Confirm/adjust the 200 list (priority order, coverage gaps, merge/split granularity) — open questions at bottom of `docs/catalog/first-200.md`.
- Build order: domain-first vs breadth-first.

<p align="center">
  <img src="logo.png" alt="Magoo Component UI" width="120" height="120" />
</p>

<h1 align="center">Magoo Component UI</h1>

<p align="center">
  <a href="https://ivanboring.github.io/magoocomponentui/"><strong>Browse the live component catalog →</strong></a>
</p>

CSS-less **skeleton UI components** for AI agents to copy as boilerplate. One canonical
source per component generates **Drupal SDC, Drupal Code Components (Preact), React, Vue,
Storybook, and a Drupal paragraph + custom_field** integration. Markup is pure **tokenized
Tailwind**; four example themes re-skin every component from a shared token contract.

The live catalog — browse every component across all four themes, plus example page
compositions — is hosted at **https://ivanboring.github.io/magoocomponentui/**.

## Quick start

```bash
pnpm install
pnpm test            # generator + schema unit tests
pnpm build           # generate dist/<id>/ variants + dist/catalog.json
pnpm preview:dev     # browse the catalog across all 4 themes (http://localhost:4321)
pnpm storybook       # component workbench
pnpm screenshots     # capture 4 themes × 4 breakpoints per component (Playwright)
```

## Authoring a component

Create `components/<category>/<name>/` with `component.def.yml`, `template.html`,
`metadata.yml`, and optional `behavior.js` / `examples/`. Then `pnpm build`. See
**[docs/authoring-guide.md](docs/authoring-guide.md)**.

## Docs

- [Authoring guide](docs/authoring-guide.md) · [Template directives](docs/template-directives.md)
- [metadata.yml schema](docs/metadata-schema.md) · [Theming](docs/theming.md) · [Taxonomy](docs/taxonomy.md)
- [Drupal mapping](docs/drupal-mapping.md) · [Design spec](docs/superpowers/specs/2026-07-04-skeleton-component-library-design.md)
- [First 200+ components](docs/catalog/first-200.md)

## Layout

```
packages/generator   # template parser (AST) + emitters (SDC/Preact/React/Vue/Storybook/Drupal)
packages/schema      # metadata JSON Schema + validator + catalog builder
packages/themes      # shared token contract + 4 theme value sets (Tailwind v4)
components/           # component sources (canonical)
dist/                # generated variants + catalog.json (build output)
preview/             # Astro static preview site
scripts/             # build, build-catalog, screenshot
```

MIT licensed.

# Theming

Components ship **no CSS**. They use **tokenized Tailwind utilities** bound to a fixed set
of CSS-variable design tokens. A theme is just a value set for those variables; swapping
the values re-skins the whole library. Contract: `packages/themes/tokens.contract.css`.

## The rule

**Every theme redefines the same variable names — never adds or renames.** To add a theme,
copy an existing `packages/themes/themes/<name>.css`, change only the values, and register
it in `packages/themes/index.css` + the preview/screenshot theme lists.

## Token contract (use these utilities in markup)

| Group | Tokens → utilities |
|---|---|
| Colour | `--color-primary`(+`-contrast`), `secondary`, `accent`, `background`, `surface`, `surface-raised`, `on-surface`, `on-surface-muted`, `border`, `ring`, `success`/`warning`/`danger`/`info`(+`-contrast`) → `bg-primary`, `text-on-surface`, `border-border`, `bg-success`… |
| Type | `--font-heading`, `--font-body`, `--font-mono` → `font-heading`, `font-body` |
| Radius | `--radius-control`, `--radius-button`, `--radius-card`, `--radius-pill` → `rounded-card`… |
| Shadow | `--shadow-card`, `--shadow-raised`, `--shadow-focus` → `shadow-card`… |
| Rhythm | `--space-section`, `--space-card`, `--space-control` → `p-(--space-card)` |
| Motion | `--duration-token`, `--ease-token` → `duration-(--duration-token)` |

**Do:** `class="bg-surface text-on-surface rounded-card shadow-card font-heading p-(--space-card)"`
**Don't:** `class="bg-white text-slate-900 rounded-lg shadow-md"` (breaks theming).

## Variant classes

When an enum prop changes appearance, map values → classes in `component.def.yml` under
`variants:` and reference `{{ prop@class }}` in the template. Keep those classes tokenized too.

## The four example themes

| Theme | Character |
|---|---|
| **simple** | Swiss: white, restrained indigo, tight radii, flat shadows. (Contract defaults.) |
| **futuristic** | Cyan × hot-magenta on indigo-black, zero radius, glow shadows, Space Grotesk. |
| **classic** | Oxblood + ink on warm ivory, brass accent, Fraunces × Spectral, moderate radius. |
| **smooth** | Rose/lavender/peach, large radii, diffuse pastel shadows, Quicksand × Nunito. |

## Switching themes

Set `data-theme="simple|futuristic|classic|smooth"` on any wrapper; every token-bound
utility inside re-resolves. The preview detail page and the screenshot pipeline both work
this way. Web fonts are loaded by the preview/Storybook/screenshot harness, not by the
components themselves.

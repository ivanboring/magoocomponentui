# Template Directives

`template.html` is valid HTML5 plus a deliberately small directive vocabulary. The set
is small on purpose: it transpiles deterministically to Twig, JSX, and Vue, and the
components are boilerplate skeletons, not application logic. **Expressions are dotted
paths only** (e.g. `item.title`) — no arbitrary JavaScript.

| Directive | Example | Meaning |
|---|---|---|
| Interpolation | `{{ title }}` | Insert an escaped prop value (text or attribute). |
| Raw HTML | `{{{ body }}}` | Insert an unescaped html-typed prop (text position). |
| Variant class | `{{ variant@class }}` | Insert the class string mapped for the current enum value (see `variants:` in `component.def.yml`). |
| Named slot | `<slot name="body">fallback</slot>` | A composition point; children are the default. |
| Conditional | `data-if="featured"` / `data-if="!featured"` | Render the element only when the path is truthy / falsy. |
| Loop | `data-for="item in items"` | Repeat the element per array entry; inner scope gets `item`. |

## Per-target translation

| Source | Twig | React / Preact | Vue |
|---|---|---|---|
| `{{ x }}` | `{{ x }}` | `{x}` | `{{ x }}` |
| `{{{ x }}}` | `{{ x\|raw }}` | `dangerouslySetInnerHTML` | `v-html` |
| `{{ v@class }}` | ternary chain | `({...}[v] \|\| "")` | `{...}[v] \|\| ''` |
| `<slot name="s">` | `{% block s %}` | `{s}` (prop) | `<slot name="s">` |
| `data-if="x"` | `{% if x %}` | `{x && (…)}` | `v-if="x"` |
| `data-for="i in xs"` | `{% for i in xs %}` | `xs.map((i,$index)=>…)` | `v-for="(i,$index) in xs"` |

## Rules & conventions

- **One JS hook class on the root** equal to the component name (e.g. `class="alert …"`).
  Behavior targets `.alert__*` hook classes, never utility classes.
- **Only tokenized utilities** for anything themable — colours, radius, shadow, type,
  spacing. Never `bg-white`/`rounded-lg`; use `bg-surface`/`rounded-card` (see `theming.md`).
- **Config for behavior goes on `data-*`** attributes (the portable init receives no props).
- Loops and conditionals attach to a single element; wrap a group in a container element
  to repeat/guard several nodes.
- `image` and `link` props are strings in the template (`src="{{ image }}"`,
  `href="{{ href }}"`); the Drupal layer resolves them from fields.

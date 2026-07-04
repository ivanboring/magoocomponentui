# Key Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Single canonical source + generator** (not hand-write per target) | Token-saving + 1000+ scale + reuse; avoids 4× authoring and drift. |
| 2 | **Tokenized Tailwind v4** (semantic utilities → CSS-var tokens) | Only way to satisfy *no component CSS* + *pure Tailwind* + *4 distinct themes* simultaneously. |
| 3 | **Shared token contract; themes = value sets only** | User requirement: same variable names everywhere → swap values to get a new style. Never rename/add per theme. |
| 4 | **Minimal template directive vocabulary** (`{{ }}`, `{{{ }}}`, `<slot>`, `data-if`, `data-for`; dotted paths + `!` only) | Small enough to transpile deterministically to twig/JSX/Vue; components are boilerplate skeletons, not app logic. |
| 5 | **Portable self-init JS** (`querySelectorAll(hook).forEach` + `MutationObserver`) as default; `Drupal.behaviors` variant optional | Matches reference theme; works in Drupal AJAX, Storybook, and static preview without hard Drupal dependency. |
| 6 | **`component.def.yml` owns types; `metadata.yml` owns prose** | Avoids duplicating prop/slot definitions; catalog builder merges both. |
| 7 | **Central `dist/` mirror** for generated variants | Clean source folders + clean git diffs; future CLI reads from `dist/`. |
| 8 | **Screenshots: 4 themes × 4 breakpoints = 16/component** (Playwright) | User choice; richer previews and listings. |
| 9 | **Static Astro preview** | User wants the preview buildable as a fully static site. |
| 10 | **Granular components, per concept** (podcast ≠ movie ≠ product card) | User guidance; each modestly configurable via props. |
| 11 | **Proof set includes complex domain components** (bracket, video player, podcast audio, notifications) | De-risks the format against the user's real intent, not just generic atoms. |

## Component-scoped hook classes vs styling
Styling = token-bound Tailwind utilities. JS targeting = component-scoped `__hook` classes (BEM-ish). Keep them separate so themes never break behavior and behavior never depends on utility classes.

## Behavior config via data-attributes (convention)
The portable self-init wrapper (SDC/preview/Storybook) calls `init(root, {})` — it has **no props object at runtime**. So behaviors MUST read configuration from the root element's `data-*` attributes (set in the template from props), e.g. `root.dataset.allowMultiple`. The React/Vue wrappers *do* pass props to `init`, but for cross-target consistency, author behaviors to rely on `data-*`. Root element also carries `class="<name>"` as the JS hook.

## OPEN DESIGN ITEM — variant → class mapping (decide before authoring components)
The template language has **no equality test** (`data-if` is truthy-only), so an enum
`variant` cannot currently pick different utility-class sets (e.g. primary vs secondary
button, or toast severity → `bg-success`/`bg-danger`). Many components need this.
Recommended approach (**b**): add a `variants:` block to `component.def.yml` mapping each
enum value → a class string, plus a template token like `{{ variant@class }}`; the
generator inlines it per target (twig `{% if %}` chain, JSX/Vue conditional class, and
the reference renderer resolves via the def). Alternative (**a**): extend `data-if` with
equality (`data-if="variant == 'primary'"`) and author N branches (verbose).
→ Implement as the first item of remaining structure, before the component phase.

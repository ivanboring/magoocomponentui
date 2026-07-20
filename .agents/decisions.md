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

## Drupal base theme (magoo_agentic_base_theme) — settings-form inheritance: CONFIRMED (2026-07-14)
Spike (Task 2, Step 10): a subtheme (`magoo_probe`, `base theme: magoo_agentic_base_theme`, nothing but an
`.info.yml`) renders the FULL token settings form at `/admin/appearance/settings/magoo_probe` — all 9
vertical tabs, 75 populated fields. Drupal 11's `ThemeSettingsForm::buildForm()` requires the
`theme-settings.php` of the edited theme AND every base theme, and calls
`alterForTheme($editing_active_theme, 'form_system_theme_settings', ...)`, which fires the base theme's
`*_form_system_theme_settings_alter()`. It also temporarily sets the edited theme active, so
`theme_get_setting($name)` with no theme argument resolves against the CHILD.
→ Assumption HOLDS. `create-child` (Task 4) does NOT need to write a `theme-settings.php` in the child.

## Runtime token block must outrank the compiled Tailwind :root (2026-07-14)
Drupal renders `html_head` (our inline `<style data-magoo-tokens>`) BEFORE the css-placeholder, so the
compiled stylesheet — which carries Tailwind's build-time `@theme` defaults on plain `:root` — comes
later and, at equal specificity, would win. `magoo_tokens_css()` therefore emits `html:root` (0,1,1)
instead of `:root` (0,1,0). Verified in-browser: with `magoo_color_primary` set to `#ff0000`,
`getComputedStyle(document.documentElement).getPropertyValue('--color-primary') === '#ff0000'`.
Do not "simplify" the selector back to `:root`.

## Base theme + child-theme generator (2026-07-14)

| # | Decision | Rationale |
|---|---|---|
| 12 | **Canonical base theme lives in `skills/drupal-theme/base-theme/`**; `custom_theme/web/themes/custom/magoo_agentic_base_theme/` is a deployed snapshot written by `install-base`. | The skill is what ships to a consuming site, so the theme must travel with it. One source, one copier — editing the deployed copy would be lost on the next `install-base` (it already drifted once: the deployed `scripts/generate-schema.mjs` is a pre-`schemaYaml()` version). |
| 13 | **The child compiles its own CSS; the base ships a prebuilt `css/dist/base.css`.** | Tailwind only emits the utilities it saw at build time, and only the *child* knows which components it installed — so the component sheet must be built there (`npm run build:css` **before** `theme:enable`). The base's own sheet covers just four page-shell templates and never changes, so committing it prebuilt lets the base install with no Node build at all. |
| 14 | **The dynamic-class safelist (`css/src/safelist.css`) is imported by the child's Tailwind entry only** — never the base's. | `grid-cols-1…12` etc. are composed from props, so they must be safelisted; but when the base emitted them too, its unconditional `.grid-cols-1` sat in the same `@layer utilities` as the child's `.sm\:grid-cols-2` at equal specificity — last sheet wins — collapsing every responsive grid in every component. Keep the safelist in the sheet that renders the components. (Corollary: a child MUST declare `dependencies: - magoo_agentic_base_theme/global` so the base sheet loads first.) |
| 15 | **A child theme ships NO `theme-settings.php`** — it inherits the base's token form. | Verified in a browser: Drupal 11's `ThemeSettingsForm::buildForm()` requires the `theme-settings.php` of the edited theme AND every base theme and calls `alterForTheme($editing_theme, …)`, so the base's `*_form_system_theme_settings_alter()` fires for the child. A bare subtheme renders all 9 vertical tabs / 75 fields. Shipping one in the child would duplicate the form. |
| 16 | **The runtime token block uses the `html:root` selector (specificity 0,1,1), not `:root`.** | Drupal renders `html_head` (our inline `<style data-magoo-tokens>`) BEFORE the css-placeholder, so the compiled Tailwind sheet — carrying the build-time `@theme` defaults on plain `:root` — comes later and would win at equal specificity, making the settings form a no-op. Do not "simplify" it back. Dark blocks are `html:root[data-color-scheme="dark"]`. |
| 17 | **Canvas mode emits the SDC and nothing else** (no paragraph type, no fields, no twig embed). | Drupal Canvas (`drupal/canvas` 1.8.0) auto-discovers SDCs and derives its own `canvas.component.sdc.<theme>.<name>` config on `drush cr` — anything we emitted alongside would be duplicate, drift-prone config. Accepted cost: Canvas has no field shape for an array-of-object prop, so only **251/528** components are eligible; `canvas-check` reports it and `create-child` warns + falls back to `paragraph` rather than shipping an SDC that never appears in the Library. |
| 18 | **Styling a site = token values + component props. Never a CSS override, never a forked component twig.** | A restyle must stay a settings change (no rebuild; still editable at `/admin/appearance/settings/<machine>` after handoff), and a component must keep tracking the catalog — a forked twig is generated output that instantly goes stale. Escape hatches, in order: an enum/prop; the `custom_css_vars` setting; a theme-owned wrapper template (this is where AOS scroll animations go). |
| 19 | **`tokens.manifest.json` is the single source of truth for tokens** — form, runtime CSS, generator and config schema all loop it. | Four hand-maintained lists would drift within a week. Adding a token to the manifest makes it appear in all four at once; `generate-schema.mjs` exports `schemaYaml()` so the base's own schema and a generated child's come from one implementation. |

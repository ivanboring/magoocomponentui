# AGENTS.md — Magoo Agentic Base Theme

A Drupal 11 **base theme** for the Magoo component catalog. It ships the design-token contract as
**runtime CSS variables**, a full token settings form, a 22-region layout, and a prebuilt
`css/dist/base.css`. It is meant to be **subtheme'd, never used directly** (`base theme: false`,
`description: "Subtheme it — do not use it directly."`).

Child themes are produced by `theme-cli create-child` (see `scripts/theme-cli/create-child.mjs`);
this directory is what `theme-cli install-base` copies into a site. Full reference:
`docs/base-theme.md`.

## Where you are / where NOT to edit

- **Edit HERE** (`skills/drupal-theme/base-theme/`). This is the source of truth.
- **NEVER edit the deployed copy** under `custom_theme/web/themes/custom/magoo_agentic_base_theme/`
  — that is `install-base` output and gets overwritten. Changes there are lost.

## The one idea that explains everything

Tailwind v4 compiles `bg-primary` to `background-color: var(--color-primary)` — it references the
variable, it does not bake in the value. So the theme emits the settings as a runtime
`html:root { … }` `<style>` block in `hook_preprocess_html` (`.theme` → `magoo_tokens_css()`).
**Changing a theme setting restyles every component with no CSS rebuild.** A CSS rebuild is only
needed when a *new utility class* is introduced (a class the prebuilt sheet never scanned).

## Files

| Path | Role |
|---|---|
| `tokens.manifest.json` | **Single source of truth** for all 9 token groups. Everything below loops it. |
| `magoo_agentic_base_theme.theme` | `preprocess_html` (emits the token `<style>`, font link, dark attr, cache-dep) + `preprocess_page` (hidden/full-bleed regions, layout vars). |
| `includes/tokens.php` | Manifest reader → runtime `:root` block. `magoo_tokens_*()` helpers. |
| `theme-settings.php` | Builds the settings form by looping the manifest. |
| `scripts/generate-schema.mjs` | Emits `config/schema/*.settings.yml` from the manifest. |
| `css/src/contract.css` | The fixed `@theme` token contract (imported by base **and** every child). |
| `css/src/base.css` | Base Tailwind entry: `@import "tailwindcss"` + contract + `@source templates`. |
| `css/src/safelist.css` | Dynamic `.grid-cols-N` etc. — **child-only**, NOT imported by `base.css` (see invariants). |
| `css/dist/base.css` | **Prebuilt, committed.** The base ships compiled CSS; children compile their own. |
| `js/color-scheme.js` | Sets `data-color-scheme` on `<html>` before first paint (library is `header: true`). |
| `*.info.yml` / `*.libraries.yml` | 22 regions, manifest-derived setting defaults, `global` library. |
| `templates/` | `html`/`page`/`region`/`block`/`node` twig. |

## Invariants — do not regress

- **`tokens.manifest.json` is the single source of truth.** The PHP settings form, the runtime CSS
  (`tokens.php`), `create-child`'s `settings.yml`, and `generate-schema.mjs` **all loop it**. To add
  or change a token, edit the manifest — every consumer picks it up. Do not hand-edit the derived
  outputs.
- **The selector is `html:root`, not `:root`** (`tokens.php`, `magoo_tokens_css()`). Drupal renders
  html_head (this `<style>`) *before* the stylesheet, so Tailwind's compiled `:root` defaults come
  later in the document and would win at equal specificity. `html:root` is (0,1,1) and outranks
  `:root` (0,1,0). **Never "simplify" it back to `:root`** — the settings would silently do nothing.
- **`contract.css` is fixed library-wide.** Every theme shares one set of CSS-variable *names*; only
  values differ. **Never rename or add a variable per theme.** Adding a new value set = a new style.
- **`safelist.css` is child-only.** If the base compiled `.grid-cols-1`, that unconditional rule
  collides with a child's `.sm:grid-cols-2` at equal specificity (last sheet wins) and kills every
  responsive layout. The base sheet must NOT import the safelist; each child compiles its own CSS.
- **The base ships prebuilt (`css/dist/base.css`); children run `build:css` themselves** (before
  `theme:enable`, since the child's library links a not-yet-built `styles.css`).
- **Token block uses `Markup::create()`** in `preprocess_html`, not a bare string — core runs
  `Xss::filterAdmin()` over an unsafe `#value` and rewrites `>` to `&gt;`, which a `<style>` element
  does not decode (would break any child combinator in the "Extra CSS variables" setting).
- **The token `<style>` adds a cache dependency on `<theme>.settings`** so the page cache drops when
  settings change. Keep it.
- **`color-scheme.js`'s library is `header: true`** — it must set `data-color-scheme` before first
  paint or a dark-preferring visitor sees a flash of the light palette.
- **A child has no `theme-settings.php`** (Drupal builds a subtheme's form from the base's) and
  **declares `dependencies: - magoo_agentic_base_theme/global`** in its `libraries.yml` so the base
  sheet loads first.
- **Styling is tokens + props only** — never a CSS override, never a forked component twig.

## Commands (run from this directory)

```
npm install
npm run build:css     # compile css/src/base.css → css/dist/base.css (only after a NEW utility class)
npm run dev           # same, in --watch
node scripts/generate-schema.mjs      # regenerate config/schema/*.schema.yml from the manifest (no args)
```

Remember: editing a **value** (color, radius, spacing…) needs no rebuild — it re-renders from the
manifest at runtime. Rebuild only when you introduce a utility class the prebuilt sheet hasn't seen.

## Adding / changing a token

1. Edit `tokens.manifest.json` (the correct group; give it `key`, `default`, `type`, and a `_dark`
   counterpart if it's a color).
2. That flows automatically to the settings form, the runtime `:root` block, child `settings.yml`,
   and the config schema (via `generate-schema.mjs`).
3. If — and only if — a component will use a **new utility class** bound to the token, add it to
   `contract.css`'s `@theme` (never rename an existing variable) and `npm run build:css`.

## See also

- `docs/base-theme.md` — full reference (regions, wiring modes, child generator).
- Root `CLAUDE.md` — "Base theme + child themes" section and the Drupal-emit invariants.

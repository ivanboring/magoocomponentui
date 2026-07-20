# Scroll animations (AOS) in a generated child theme

**AOS** — Animate On Scroll, <https://michalsnik.github.io/aos/>, v2.3.4 — reveals elements as they
scroll into the viewport (`fade-up`, `fade-in`, `zoom-in`, …).

This is a **skill-level capability, not a base-theme setting**: nothing in
`skills/drupal-theme/base-theme/tokens.manifest.json` turns it on. If the user says yes to scroll
animations, *you* wire AOS into the child theme, following this page.

**When to propose it:** magazine, PR, editorial and marketing pages — sites whose landing pages are a
long scroll of stacked sections. **When to advise against it:** app-like UIs, admin screens, and
data-rich sites (dashboards, tables, listings), where motion on every row is noise and slows the
reader down. It is **off by default** — only add it when the user asks for it.

## Rule 1 (non-negotiable): never touch a component's Twig

The animation attributes go on a wrapper **the theme owns**, never inside a catalog component:

- the page-builder field template the generator emits for a host content type —
  `templates/field--<host>-components.html.twig` (it stacks the paragraphs of a landing page), and/or
- a **theme-level JS** pass that stamps the attributes onto the top-level items it selects at runtime.

Do **not** add `data-aos` inside `components/<name>/<name>.twig` — not even `layout/section-wrapper`.
Component Twig is generated from the catalog and gets overwritten on the next `magoo build`; forking
it also breaks the "a component is restyled by settings, never by editing it" contract. The JS pass
below is how you animate a `section-wrapper` (or any component) without editing it.

## 1. Load AOS lazily, from JS, per this repo's external-library convention

Same pattern as `components/video/video-player-live/behavior.js` (hls.js) and
`components/auth/two-factor-setup/behavior.js` (qrcode), documented in `docs/external-libraries.md`:
a **dynamic `import()` of a CDN ESM build**, with `/* @vite-ignore */`, reusing a preloaded global if
one exists. **Not a `<script>` tag.** AOS also needs its stylesheet, which the loader injects.

Create `js/scroll-animations.js` **in the child theme** (theme-owned code — no component involved):

```js
// <machine>/js/scroll-animations.js — theme-owned scroll reveals (AOS 2.3.4).
(function () {
  const AOS_JS = "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";
  const AOS_CSS = "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css";
  const REDUCED = "(prefers-reduced-motion: reduce)";

  // The items the THEME animates. Top-level children of the page-builder field wrapper, plus any
  // section-wrapper rendered outside it. Never a selector inside a component's markup.
  const SELECTOR = ".landing-components > *, main > .section-wrapper";

  async function load() {
    if (window.AOS) return window.AOS;
    if (!document.querySelector('link[data-aos-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = AOS_CSS;
      link.dataset.aosCss = "";
      document.head.appendChild(link);
    }
    const mod = await import(/* @vite-ignore */ AOS_JS);
    return mod.default || mod;
  }

  async function start() {
    // Reduced motion: don't even fetch the library.
    if (window.matchMedia(REDUCED).matches) return;
    // The Canvas editor renders the real front end inside an iframe — don't animate while editing.
    if (window.self !== window.top) return;

    const items = document.querySelectorAll(SELECTOR);
    if (!items.length) return;
    items.forEach((el, i) => {
      if (el.hasAttribute("data-aos")) return;
      el.setAttribute("data-aos", "fade-up");
      el.setAttribute("data-aos-delay", String(Math.min(i, 3) * 80)); // small stagger, capped
    });

    const AOS = await load();
    if (!AOS) return; // CDN blocked/offline -> no animation, content still renders
    AOS.init({
      once: true,                 // reveal once; no re-animation on scroll back
      duration: 600,
      easing: "ease-out-cubic",
      offset: 80,
      disable: () => window.matchMedia(REDUCED).matches,
    });
  }

  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})();
```

Notes on the snippet:

- `disable: () => …prefers-reduced-motion…` is **required, not optional** — and the early return
  above it means a reduced-motion visitor never even downloads AOS.
- `once: true` keeps a long page calm; without it every section replays on the way back up.
- Dynamic `import()` works in a classic script, so the Drupal library below needs no `type: module`.
- If the CDN import fails, the page renders exactly as it does today — nothing is hidden by AOS's own
  CSS until AOS is running, because the attributes are stamped in the same pass that loads it.

## 2. Attach it as a theme library

Add the JS to the child's existing global library — `<machine>.libraries.yml`, which `create-child`
generated with only a `css:` key:

```yaml
global:
  css:
    theme:
      css/dist/styles.css: {}
  js:
    js/scroll-animations.js: {}
  dependencies:
    - magoo_agentic_base_theme/global
```

**Caveat:** `create-child` rewrites `<machine>.libraries.yml` verbatim. If you ever re-run it over the
same theme, re-add the `js:` block.

No cache-rebuild subtlety beyond the usual: `drush cr` after editing the libraries file.

## 3. Markup-side alternative (build-time attributes)

If you would rather not stamp attributes from JS, put them in the **theme's own** field template —
`templates/field--<host>-components.html.twig`, emitted by the generator's host-content-type support.
Wrap each stacked item (the generator's version renders `{{ item.content }}` wrapperless):

```twig
{% for item in items %}
  <div data-aos="fade-up" data-aos-delay="{{ loop.index0 * 80 }}">{{ item.content }}</div>
{% endfor %}
```

Keep the JS file anyway — it still loads AOS and calls `AOS.init()`; just drop the `SELECTOR` /
`items.forEach` stamping block. Note this route only covers **paragraph-stacked** landing pages: a
**Canvas** page renders a component tree, not this field, so Canvas sites need the JS selector route.

## 4. The attributes worth knowing

| Attribute | Value |
|---|---|
| `data-aos` | the animation: `fade-up` (the safe default), `fade-in`, `fade-right`/`-left`, `zoom-in`, `slide-up` |
| `data-aos-delay` | ms, for a stagger across sibling items (`0`, `80`, `160`, …) |
| `data-aos-duration` | ms, per-element override of `init`'s `duration` |
| `data-aos-once` | `true`/`false`, per-element override of `once` |

Keep it to one animation type per page. A page where every block enters from a different direction
reads as a demo, not a design.

## 5. AOS ships its own CSS — and that is fine here

`aos.css` sets the initial hidden/translated state and the transitions. The catalog's "components ship
no CSS" rule is **not** broken by this: the stylesheet belongs to the **theme**, is loaded by
theme-owned JS, and is only present when the site opts in. The components remain CSS-less and keep
tracking the catalog. Two consequences to state to the user:

- it is an extra ~2 KB of CSS plus ~14 KB of JS, fetched from a CDN at runtime;
- **off by default** — do not add it to a theme that did not ask for it.

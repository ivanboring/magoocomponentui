/**
 * Behavior wrapping. The canonical `behavior.js` is authored as a portable ES module:
 *
 *   export default function init(root, props) { … ; return () => cleanup }
 *
 * We wrap it per target: a portable self-init IIFE for SDC / preview / Storybook
 * (works under Drupal AJAX via MutationObserver — no Drupal core dependency), and
 * an inline `init` for the React/Vue effect hooks.
 *
 * Convention: the component's root element carries `class="<name>"` (its machine
 * name) as the JS hook; `init` receives that element.
 */

/**
 * Turn `export default function init(...) {}` (or an arrow default) into a bare
 * `function init` / `const init = …` declaration.
 * @param {string} source
 */
export function stripToInit(source) {
  const trimmed = source.trim();
  if (/export\s+default\s+function\s+init\b/.test(trimmed)) {
    return trimmed.replace(/export\s+default\s+function\s+init\b/, "function init");
  }
  if (/export\s+default\s+function\b/.test(trimmed)) {
    return trimmed.replace(/export\s+default\s+function\b/, "function init");
  }
  if (/export\s+default\s+/.test(trimmed)) {
    // arrow or expression default
    return trimmed.replace(/export\s+default\s+/, "const init = ");
  }
  return trimmed;
}

/**
 * Portable self-initializing IIFE (SDC .js, preview, Storybook).
 * @param {string} name  component machine name (also the hook class)
 * @param {string} source  authored behavior.js
 */
export function wrapPortable(name, source) {
  const init = stripToInit(source);
  return `/* Auto-generated from behavior.js — portable self-init (Drupal AJAX / Storybook / static). */
(function () {
  ${init.split("\n").join("\n  ")}

  var HOOK = ".${name}";
  var FLAG = "__magooInit_${name.replace(/[^a-z0-9]/gi, "_")}";
  function boot(scope) {
    (scope || document).querySelectorAll(HOOK).forEach(function (el) {
      if (el[FLAG]) return;
      el[FLAG] = true;
      init(el, {});
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(); });
  } else {
    boot();
  }
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(HOOK)) {
            if (!node[FLAG]) { node[FLAG] = true; init(node, {}); }
          }
          boot(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
`;
}

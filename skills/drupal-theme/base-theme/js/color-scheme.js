/**
 * Dark-mode toggle. The theme setting decides whether a toggle button exists at all;
 * this only wires it up and persists the choice. `data-color-scheme` on <html> flips the
 * [data-color-scheme="dark"] variable block emitted by hook_preprocess_html().
 *
 * The library attaches this in the <head> (header: true), so the attribute is on <html> before
 * first paint and a dark-preferring visitor never sees a flash of the light palette.
 */
(function () {
  "use strict";
  var KEY = "magoo-color-scheme";
  var root = document.documentElement;

  function prefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function current() {
    return root.getAttribute("data-color-scheme") === "dark" ? "dark" : "light";
  }

  function apply(scheme) {
    root.setAttribute("data-color-scheme", scheme);
    var pressed = scheme === "dark" ? "true" : "false";
    var buttons = document.querySelectorAll(".magoo-color-scheme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", pressed);
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }

  // Seed the attribute on the very first visit too: without this, `data-color-scheme` is unset on a
  // dark-preferring OS (the media query alone paints it dark), so the first click computed "dark"
  // -> set "dark" -> nothing visibly changed. Seeding from the OS makes the first click flip.
  if (saved !== "dark" && saved !== "light") {
    saved = prefersDark() ? "dark" : "light";
  }
  root.setAttribute("data-color-scheme", saved);

  function toggle() {
    var next = current() === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
  }

  // The buttons do not exist yet at head time; sync their aria-pressed once the DOM is parsed.
  function sync() { apply(current()); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  }
  else {
    sync();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".magoo-color-scheme-toggle") : null;
    if (btn) {
      e.preventDefault();
      toggle();
    }
  });
})();

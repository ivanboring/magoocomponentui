/**
 * Autocomplete panel — a search input with a grouped suggestions popover.
 * The panel opens on focus and while typing; clicking a suggestion fills the
 * input, closes the panel and fires suggest:pick with the chosen { label }.
 * Escape or an outside click closes it. Config is read from the DOM only
 * (portable init passes no props object); all listeners are cleaned up.
 */
export default function init(root) {
  const input = root.querySelector(".autocomplete-panel__input");
  const panel = root.querySelector(".autocomplete-panel__panel");
  if (!input || !panel) return () => {};

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    input.setAttribute("aria-expanded", open ? "true" : "false");
  }
  const isOpen = () => root.dataset.open === "true";

  function onFocus() {
    setOpen(true);
  }
  function onInput() {
    setOpen(true);
  }
  function onPanelClick(event) {
    const option = event.target.closest(".autocomplete-panel__option");
    if (!option) return;
    input.value = option.dataset.label || "";
    root.dispatchEvent(new CustomEvent("suggest:pick", {
      bubbles: true,
      detail: { label: option.dataset.label },
    }));
    setOpen(false);
    input.focus();
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      setOpen(false);
    }
  }
  function onOutside(event) {
    if (!root.contains(event.target)) setOpen(false);
  }

  input.addEventListener("focus", onFocus);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKey);
  panel.addEventListener("click", onPanelClick);
  document.addEventListener("click", onOutside);

  return () => {
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKey);
    panel.removeEventListener("click", onPanelClick);
    document.removeEventListener("click", onOutside);
  };
}

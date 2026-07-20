/**
 * Recent searches — remove one history chip or clear the whole list.
 *
 * Each chip's × button hides its chip (via the element's `hidden` property, never a `hidden`
 * utility class) and dispatches a bubbling "recent:remove" event carrying the chip's data-label.
 * The header's clear button hides every chip and dispatches "recent:clear". Persisting the history
 * is the host page's job — this only manages the chips' own visibility.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const chips = Array.from(root.querySelectorAll(".recent-searches__chip"));
  const removeButtons = Array.from(root.querySelectorAll(".recent-searches__remove"));
  const clearButton = root.querySelector(".recent-searches__clear");

  const onRemove = (event) => {
    const button = event.currentTarget;
    const chip = button.closest(".recent-searches__chip");
    const label = button.dataset.label || "";
    if (chip) chip.hidden = true;
    root.dispatchEvent(new CustomEvent("recent:remove", { bubbles: true, detail: { label } }));
  };

  const onClear = () => {
    for (const chip of chips) chip.hidden = true;
    root.dispatchEvent(new CustomEvent("recent:clear", { bubbles: true }));
  };

  for (const button of removeButtons) button.addEventListener("click", onRemove);
  clearButton?.addEventListener("click", onClear);

  return () => {
    for (const button of removeButtons) button.removeEventListener("click", onRemove);
    clearButton?.removeEventListener("click", onClear);
  };
}

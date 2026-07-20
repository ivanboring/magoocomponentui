/**
 * Modifier picker — toggles option chips and reports each change.
 * Clicking a chip flips its data-selected/aria-pressed state and dispatches a bubbling
 * "modifier:change" CustomEvent carrying the option label and its new selected state. Initial state
 * is read from each chip's data-selected attribute (no props object is passed).
 */
export default function init(root) {
  const options = Array.from(root.querySelectorAll(".modifier-picker__option"));

  const syncAria = (btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.selected === "true" ? "true" : "false");
  };
  options.forEach(syncAria);

  const handlers = options.map((btn) => {
    const h = () => {
      const selected = btn.dataset.selected !== "true";
      btn.dataset.selected = selected ? "true" : "false";
      syncAria(btn);
      const label = btn.querySelector("span")?.textContent?.trim() || "";
      root.dispatchEvent(new CustomEvent("modifier:change", {
        bubbles: true,
        detail: { label, selected },
      }));
    };
    btn.addEventListener("click", h);
    return h;
  });

  return () => {
    options.forEach((btn, i) => btn.removeEventListener("click", handlers[i]));
  };
}

/**
 * Portfolio grid — filter chips that show/hide work tiles by category.
 *
 * Clicking a chip marks it active (and clears the others) and shows only the tiles whose
 * data-category matches the chip's data-value; the leading "All" chip has an empty value and shows
 * everything. Visibility is toggled via the element's `hidden` property (never a `hidden` utility
 * class, which would clash with the responsive grid display utilities). After each change the root
 * dispatches a "portfolio:filter" CustomEvent whose detail carries the active value and the number
 * of visible tiles, so a surrounding page can react (e.g. update a count or empty state).
 *
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const chips = Array.from(root.querySelectorAll(".portfolio-grid__chip"));
  const items = Array.from(root.querySelectorAll(".portfolio-grid__item"));
  if (!chips.length) return () => {};

  const apply = (value) => {
    let visible = 0;
    for (const item of items) {
      const hide = value !== "" && item.dataset.category !== value;
      item.hidden = hide;
      if (!hide) visible += 1;
    }
    root.dispatchEvent(
      new CustomEvent("portfolio:filter", {
        bubbles: true,
        detail: { value, visible },
      }),
    );
  };

  const onClick = (event) => {
    const chip = event.currentTarget;
    for (const c of chips) c.dataset.active = c === chip ? "true" : "false";
    apply(chip.dataset.value || "");
  };

  for (const chip of chips) chip.addEventListener("click", onClick);

  // Reflect the initially-active chip (the "All" chip by default).
  const active = chips.find((c) => c.dataset.active === "true") || chips[0];
  apply(active.dataset.value || "");

  return () => {
    for (const chip of chips) chip.removeEventListener("click", onClick);
  };
}

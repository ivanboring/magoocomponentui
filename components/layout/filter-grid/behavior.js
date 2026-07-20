/**
 * Filter grid — chips that show/hide cards by category.
 *
 * Clicking a chip marks it active (and clears the others) and shows only the items whose
 * data-category matches the chip's data-value; the leading "All" chip has an empty value and
 * shows everything. Visibility is toggled via the element's `hidden` property (never a `hidden`
 * utility class, which would clash with the responsive grid display utilities).
 *
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const chips = Array.from(root.querySelectorAll(".filter-grid__chip"));
  const items = Array.from(root.querySelectorAll(".filter-grid__item"));
  if (!chips.length) return () => {};

  const apply = (value) => {
    for (const item of items) {
      item.hidden = value !== "" && item.dataset.category !== value;
    }
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

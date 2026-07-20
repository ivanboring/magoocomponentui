/**
 * Forum tag filter — toggle topic tags on and off.
 *
 * Clicking a tag flips its data-active state (independently of the others, so several can be on at
 * once) and dispatches a bubbling "tag:toggle" CustomEvent with detail { tag, active }. aria-pressed
 * is kept in sync so the toggle state is announced.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const tags = Array.from(root.querySelectorAll(".tag-filter-forum__tag"));
  if (!tags.length) return () => {};

  // Normalise the initial pressed state from data-active.
  for (const tag of tags) {
    tag.setAttribute("aria-pressed", tag.dataset.active === "true" ? "true" : "false");
  }

  const onClick = (event) => {
    const tag = event.currentTarget;
    const active = tag.dataset.active !== "true";
    tag.dataset.active = active ? "true" : "false";
    tag.setAttribute("aria-pressed", active ? "true" : "false");
    root.dispatchEvent(new CustomEvent("tag:toggle", {
      bubbles: true,
      detail: { tag: tag.dataset.label || "", active },
    }));
  };

  for (const tag of tags) tag.addEventListener("click", onClick);

  return () => {
    for (const tag of tags) tag.removeEventListener("click", onClick);
  };
}

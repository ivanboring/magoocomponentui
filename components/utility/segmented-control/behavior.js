/**
 * Segmented control — single-select switch. Clicking a segment activates it (clearing the
 * others) and emits a bubbling "segment:change" event with { value }. Config comes from the
 * DOM (portable init passes no props object); each segment carries a data-value.
 */
export default function init(root) {
  const segs = Array.from(root.querySelectorAll(".segmented-control__seg"));
  if (!segs.length) return () => {};

  function onClick(event) {
    const seg = event.target.closest(".segmented-control__seg");
    if (!seg || !root.contains(seg)) return;
    for (const s of segs) {
      const active = s === seg;
      s.dataset.active = String(active);
      s.setAttribute("aria-pressed", String(active));
    }
    root.dispatchEvent(
      new CustomEvent("segment:change", { bubbles: true, detail: { value: seg.dataset.value } }),
    );
  }

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Syllabus accordion — each section trigger toggles its panel; multiple can be open.
 */
export default function init(root, props) {
  function onClick(event) {
    const trigger = event.target.closest(".syllabus-accordion__trigger");
    if (!trigger) return;
    const panel = trigger.closest(".syllabus-accordion__section").querySelector(".syllabus-accordion__panel");
    const open = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!open));
    panel.dataset.open = String(!open);
    panel.classList.toggle("hidden", open);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

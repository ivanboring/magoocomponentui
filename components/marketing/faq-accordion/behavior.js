/**
 * FAQ accordion — each trigger toggles its panel; multiple can be open. aria-expanded on
 * the trigger and data-open on the panel drive the visual state.
 */
export default function init(root, props) {
  function onClick(event) {
    const trigger = event.target.closest(".faq-accordion__trigger");
    if (!trigger) return;
    const panel = trigger.closest(".faq-accordion__item").querySelector(".faq-accordion__panel");
    const open = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!open));
    panel.dataset.open = String(!open);
    panel.classList.toggle("hidden", open);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

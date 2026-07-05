/**
 * Tip selector — single-select tip option; emits tip:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const opt = event.target.closest(".tip-selector__option");
    if (!opt) return;
    root.querySelectorAll(".tip-selector__option").forEach((o) => {
      const on = o === opt;
      o.dataset.active = String(on);
      o.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("tip:change", { bubbles: true, detail: { tip: opt.querySelector(".font-heading")?.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

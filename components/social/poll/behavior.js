/**
 * Poll — clicking an option marks it voted (single choice) and emits poll:vote. Result
 * bars are precomputed; a real poll would refresh them from the server after voting.
 */
export default function init(root, props) {
  function onClick(event) {
    const option = event.target.closest(".poll__option");
    if (!option) return;
    root.querySelectorAll(".poll__option").forEach((o) => {
      const on = o === option;
      o.dataset.voted = String(on);
      o.querySelectorAll("[data-voted]").forEach((el) => { el.dataset.voted = String(on); });
    });
    root.dataset.voted = "true";
    root.dispatchEvent(new CustomEvent("poll:vote", { bubbles: true, detail: { label: option.querySelector(".font-medium")?.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

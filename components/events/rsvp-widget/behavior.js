/**
 * RSVP widget — single-select going/maybe/no; emits rsvp:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const option = event.target.closest(".rsvp-widget__option");
    if (!option) return;
    root.querySelectorAll(".rsvp-widget__option").forEach((o) => {
      const on = o === option;
      o.dataset.active = String(on);
      o.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("rsvp:change", { bubbles: true, detail: { value: option.dataset.value } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

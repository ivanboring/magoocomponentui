/**
 * Floating action button — optional speed-dial toggle.
 * If secondary actions are present, pressing the FAB toggles the dial open/closed
 * (data-open on the anchor drives the CSS reveal and the icon rotation) and updates
 * aria-expanded; each action button emits a bubbling "fab:action" event with { label } and
 * closes the dial. With no actions, the FAB is a single primary action and pressing it emits
 * fab:action with the FAB's own label. Config comes from the DOM (no props object is passed).
 */
export default function init(root) {
  const anchor = root.querySelector(".floating-action-button__anchor");
  const toggle = root.querySelector(".floating-action-button__toggle");
  const dial = root.querySelector(".floating-action-button__dial");
  if (!toggle) return () => {};

  function close() {
    if (!anchor) return;
    anchor.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
  }

  function onClick(event) {
    const action = event.target.closest(".floating-action-button__action");
    if (action && root.contains(action)) {
      root.dispatchEvent(
        new CustomEvent("fab:action", { bubbles: true, detail: { label: action.dataset.label } }),
      );
      close();
      return;
    }
    const t = event.target.closest(".floating-action-button__toggle");
    if (!t || !root.contains(t)) return;
    if (dial && anchor) {
      const open = anchor.dataset.open !== "true";
      anchor.dataset.open = String(open);
      toggle.setAttribute("aria-expanded", String(open));
    } else {
      root.dispatchEvent(
        new CustomEvent("fab:action", {
          bubbles: true,
          detail: { label: toggle.getAttribute("aria-label") },
        }),
      );
    }
  }

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Push opt-in — allow/dismiss fire an event and hide the card.
 */
export default function init(root, props) {
  function decide(kind) {
    root.dispatchEvent(new CustomEvent(`push-optin:${kind}`, { bubbles: true }));
    root.setAttribute("hidden", "");
  }
  function onClick(event) {
    if (event.target.closest("[data-optin-allow]")) decide("allow");
    else if (event.target.closest("[data-optin-dismiss]")) decide("dismiss");
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Cookie consent — accept/reject/settings dispatch an event and hide the banner.
 */
export default function init(root, props) {
  function decide(kind) {
    root.dispatchEvent(new CustomEvent(`cookie-consent:${kind}`, { bubbles: true }));
    if (kind !== "settings") root.setAttribute("hidden", "");
  }
  function onClick(event) {
    if (event.target.closest("[data-cookie-accept]")) decide("accept");
    else if (event.target.closest("[data-cookie-reject]")) decide("reject");
    else if (event.target.closest("[data-cookie-settings]")) decide("settings");
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

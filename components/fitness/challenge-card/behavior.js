/**
 * Challenge card — the join button toggles between "Join challenge" and "Joined".
 * State lives on the button's data-joined attribute (the template's data-[joined=true]:* variants
 * drive the visual swap); on each click it flips, updates aria-pressed, and dispatches a bubbling
 * challenge:join event so a host can persist membership.
 */
export default function init(root) {
  const btn = root.querySelector(".challenge-card__join");
  if (!btn) return () => {};

  function onClick() {
    const joined = btn.dataset.joined !== "true";
    btn.dataset.joined = joined ? "true" : "false";
    btn.setAttribute("aria-pressed", joined ? "true" : "false");
    root.dispatchEvent(new CustomEvent("challenge:join", { bubbles: true, detail: { joined } }));
  }

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}

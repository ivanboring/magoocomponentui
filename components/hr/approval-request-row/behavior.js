/**
 * Approval request row — approve/deny handling.
 *
 * The two buttons carry data-decision="approve" | "deny". Clicking either dispatches a bubbling
 * "approval:decision" event with { decision } so a host can act on it, then marks the row as
 * resolved via data-resolved="<decision>" (a host may style or remove it). Config is read from the
 * DOM only (the portable init passes no props object).
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll("[data-decision]"));
  if (!buttons.length) return () => {};

  function decide(decision) {
    root.dataset.resolved = decision;
    root.dispatchEvent(
      new CustomEvent("approval:decision", {
        bubbles: true,
        detail: { decision },
      })
    );
  }

  const handlers = buttons.map((button) => {
    const h = () => decide(button.dataset.decision);
    button.addEventListener("click", h);
    return h;
  });

  return () => {
    buttons.forEach((button, i) => button.removeEventListener("click", handlers[i]));
  };
}

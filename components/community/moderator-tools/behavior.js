/**
 * Moderator tools — dispatch a chosen moderation action.
 *
 * Each button carries its identifier in data-action; clicking one dispatches a bubbling
 * "mod:action" CustomEvent whose detail is { action } so a host can run the moderation.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".moderator-tools__action"));
  if (!buttons.length) return () => {};

  const onClick = (event) => {
    const action = event.currentTarget.dataset.action || "";
    root.dispatchEvent(new CustomEvent("mod:action", { bubbles: true, detail: { action } }));
  };

  for (const button of buttons) button.addEventListener("click", onClick);

  return () => {
    for (const button of buttons) button.removeEventListener("click", onClick);
  };
}

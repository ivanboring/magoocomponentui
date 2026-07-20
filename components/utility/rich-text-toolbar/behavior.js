/**
 * Rich-text toolbar — toggles a control's pressed state and announces the command.
 * Config comes from the DOM (portable init passes no props object): each button carries a
 * data-command; clicking it flips its data-active/aria-pressed and emits a bubbling
 * "format:command" event with { command } so a host editor can apply the formatting.
 */
export default function init(root) {
  function onClick(event) {
    const btn = event.target.closest(".rich-text-toolbar__btn");
    if (!btn || !root.contains(btn)) return;
    const active = btn.dataset.active !== "true";
    btn.dataset.active = String(active);
    btn.setAttribute("aria-pressed", String(active));
    root.dispatchEvent(
      new CustomEvent("format:command", {
        bubbles: true,
        detail: { command: btn.dataset.command, active },
      }),
    );
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

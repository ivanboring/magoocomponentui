/**
 * Channel header — subscribe toggle updates the button state and emits channel:subscribe.
 */
export default function init(root, props) {
  const button = root.querySelector(".channel-header__subscribe");
  if (!button) return () => {};
  function onClick() {
    const next = button.dataset.subscribed !== "true";
    button.dataset.subscribed = String(next);
    button.setAttribute("aria-pressed", String(next));
    button.querySelectorAll("[data-subscribed]").forEach((el) => { el.dataset.subscribed = String(next); });
    root.dispatchEvent(new CustomEvent("channel:subscribe", { bubbles: true, detail: { subscribed: next } }));
  }
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}

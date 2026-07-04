/**
 * Toast — auto-dismisses after data-duration ms (0 disables), pauses on hover, and
 * dismisses on the close button. Fires notification-toast:dismissed so a stack manager
 * can reflow remaining toasts.
 */
export default function init(root, props) {
  const button = root.querySelector(".notification-toast__dismiss");
  const duration = Number(root.dataset.duration) || 0;
  let timer = null;

  function dismiss() {
    clearTimeout(timer);
    root.setAttribute("hidden", "");
    root.dispatchEvent(new CustomEvent("notification-toast:dismissed", { bubbles: true }));
  }
  function start() { if (duration > 0) timer = setTimeout(dismiss, duration); }
  function pause() { clearTimeout(timer); }

  button?.addEventListener("click", dismiss);
  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", start);
  start();
  return () => {
    clearTimeout(timer);
    button?.removeEventListener("click", dismiss);
    root.removeEventListener("mouseenter", pause);
    root.removeEventListener("mouseleave", start);
  };
}

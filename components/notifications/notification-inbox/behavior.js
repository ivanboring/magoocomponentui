/**
 * Notification inbox — "Mark all read" clears unread state on child rows and zeroes
 * the header count. Rows are notification-list-item elements carrying data-unread.
 */
export default function init(root, props) {
  const button = root.querySelector(".notification-inbox__mark-all");
  if (!button) return () => {};
  function markAll() {
    root.querySelectorAll('[data-unread="true"]').forEach((row) => {
      row.dataset.unread = "false";
      row.querySelector(".notification-list-item__dot")?.remove();
    });
    const count = root.querySelector(".notification-inbox__count");
    if (count) count.remove();
    root.dispatchEvent(new CustomEvent("notification-inbox:mark-all-read", { bubbles: true }));
  }
  button.addEventListener("click", markAll);
  return () => button.removeEventListener("click", markAll);
}

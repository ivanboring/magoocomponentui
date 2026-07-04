/**
 * Notification center — filter tabs switch the active filter (fires
 * notification-center:filter); "Mark all read" clears unread rows. Row filtering
 * itself (by data-category / data-unread) is left to the integrating app.
 */
export default function init(root, props) {
  function onClick(event) {
    const filter = event.target.closest(".notification-center__filter");
    if (filter) {
      root.querySelectorAll(".notification-center__filter").forEach((f) => {
        const active = f === filter;
        f.dataset.active = String(active);
        f.setAttribute("aria-selected", String(active));
      });
      root.dispatchEvent(new CustomEvent("notification-center:filter", { bubbles: true, detail: { value: filter.dataset.value } }));
      return;
    }
    if (event.target.closest("[data-mark-all-read]")) {
      root.querySelectorAll('[data-unread="true"]').forEach((row) => {
        row.dataset.unread = "false";
        row.querySelector(".notification-list-item__dot")?.remove();
      });
      root.dispatchEvent(new CustomEvent("notification-center:mark-all-read", { bubbles: true }));
    }
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

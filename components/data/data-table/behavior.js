/**
 * Data table — clicking a sortable header cycles its sort (none → asc → desc) and emits
 * data-table:sort. Actual row sorting is left to the integrating app / server.
 */
export default function init(root, props) {
  function onClick(event) {
    const btn = event.target.closest(".data-table__sort");
    if (!btn) return;
    const cur = btn.dataset.sorted || "";
    const next = cur === "asc" ? "desc" : cur === "desc" ? "" : "asc";
    root.querySelectorAll(".data-table__sort").forEach((b) => { if (b !== btn) b.dataset.sorted = ""; });
    root.querySelectorAll("[aria-sort]").forEach((th) => th.setAttribute("aria-sort", "none"));
    btn.dataset.sorted = next;
    btn.querySelectorAll("[data-sorted]").forEach((el) => { el.dataset.sorted = next; });
    const th = btn.closest("[aria-sort]");
    if (th) th.setAttribute("aria-sort", next === "asc" ? "ascending" : next === "desc" ? "descending" : "none");
    root.dispatchEvent(new CustomEvent("data-table:sort", { bubbles: true, detail: { column: btn.textContent.trim(), direction: next } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

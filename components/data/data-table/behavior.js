/**
 * Data table — clicking a sortable header cycles its sort (none → asc → desc → none),
 * reorders the rows client-side by that column, updates the header arrow + aria-sort, and
 * emits data-table:sort so an integrating app can also sort server-side if it prefers.
 * Numeric-aware string collation handles both text and number columns; the "none" state
 * restores the original row order captured at init.
 */
export default function init(root, props) {
  const tbody = root.querySelector(".data-table__table tbody");
  const original = tbody ? Array.from(tbody.querySelectorAll("tr")) : [];

  function columnIndex(btn) {
    const th = btn.closest("th");
    if (!th || !th.parentElement) return -1;
    return Array.from(th.parentElement.children).indexOf(th);
  }
  function sortRows(colIndex, direction) {
    if (!tbody || colIndex < 0) return;
    if (!direction) {
      // Restore the original order.
      original.forEach((tr) => tbody.appendChild(tr));
      return;
    }
    const dir = direction === "desc" ? -1 : 1;
    Array.from(tbody.querySelectorAll("tr"))
      .sort((ra, rb) => {
        const a = (ra.children[colIndex]?.textContent || "").trim();
        const b = (rb.children[colIndex]?.textContent || "").trim();
        return dir * a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      })
      .forEach((tr) => tbody.appendChild(tr));
  }
  function reset(btn) {
    btn.dataset.sorted = "";
    btn.querySelectorAll("[data-sorted]").forEach((el) => { el.dataset.sorted = ""; });
  }

  function onClick(event) {
    const btn = event.target.closest(".data-table__sort");
    if (!btn) return;
    const cur = btn.dataset.sorted || "";
    const next = cur === "asc" ? "desc" : cur === "desc" ? "" : "asc";
    // Clear every other column's sort state — both the button and its arrow svg — so the
    // indicator never lingers on a previously sorted header.
    root.querySelectorAll(".data-table__sort").forEach((b) => { if (b !== btn) reset(b); });
    root.querySelectorAll("[aria-sort]").forEach((th) => th.setAttribute("aria-sort", "none"));
    // Apply the new state to the clicked header (arrow follows via [data-sorted] variants).
    btn.dataset.sorted = next;
    btn.querySelectorAll("[data-sorted]").forEach((el) => { el.dataset.sorted = next; });
    const th = btn.closest("[aria-sort]");
    if (th) th.setAttribute("aria-sort", next === "asc" ? "ascending" : next === "desc" ? "descending" : "none");
    sortRows(columnIndex(btn), next);
    root.dispatchEvent(new CustomEvent("data-table:sort", { bubbles: true, detail: { column: btn.textContent.trim(), direction: next } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

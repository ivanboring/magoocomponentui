/**
 * Navbar with three-level dropdowns.
 *
 * Desktop reveal is pure CSS (group-hover / group-focus-within); this behavior adds click/tap
 * toggling (for touch and keyboard) plus Escape / outside-click closing. Open state lives in a
 * `data-open` attribute on each `[data-open]` group, which the template's `group-data-[open=true]`
 * classes also react to — so a statically `data-open="true"` group renders open with no JS
 * (used by the examples/screenshots). Config comes from the DOM; no props object is passed.
 */
export default function init(root) {
  const groups = () => Array.from(root.querySelectorAll("[data-open]"));
  const triggerOf = (g) => g.querySelector(":scope > .navbar-dropdown__trigger");

  const setOpen = (g, open) => {
    g.dataset.open = open ? "true" : "false";
    const t = triggerOf(g);
    if (t) t.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const closeAll = () => groups().forEach((g) => setOpen(g, false));

  // Open g and keep its ancestor chain; close every sibling/cousin branch.
  const openTo = (g) => {
    groups().forEach((o) => {
      if (o === g || o.contains(g)) return;
      setOpen(o, false);
    });
    setOpen(g, true);
  };
  // Close g and anything nested inside it.
  const closeBranch = (g) => {
    groups().forEach((o) => {
      if (o === g || g.contains(o)) setOpen(o, false);
    });
  };

  const onTriggerClick = (event) => {
    const g = event.currentTarget.closest("[data-open]");
    if (!g) return;
    if (g.dataset.open === "true") closeBranch(g);
    else openTo(g);
  };
  const triggers = Array.from(root.querySelectorAll(".navbar-dropdown__trigger"));
  triggers.forEach((t) => t.addEventListener("click", onTriggerClick));

  const onKeydown = (event) => {
    if (event.key === "Escape") closeAll();
  };
  root.addEventListener("keydown", onKeydown);

  const onDocPointer = (event) => {
    if (!root.contains(event.target)) closeAll();
  };
  document.addEventListener("click", onDocPointer);

  return () => {
    triggers.forEach((t) => t.removeEventListener("click", onTriggerClick));
    root.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onDocPointer);
  };
}

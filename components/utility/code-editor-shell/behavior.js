/**
 * Code editor shell — activates the clicked file tab and announces the selection.
 * Presentation only: clicking a tab marks it active (clearing the others) and emits a
 * bubbling "tab:select" event with { name } so a host can swap the shown source. Config
 * comes from the DOM (portable init passes no props object); each tab carries a data-tab.
 */
export default function init(root) {
  const tabs = Array.from(root.querySelectorAll(".code-editor-shell__tab"));
  if (!tabs.length) return () => {};

  function onClick(event) {
    const tab = event.target.closest(".code-editor-shell__tab");
    if (!tab || !root.contains(tab)) return;
    for (const t of tabs) {
      const active = t === tab;
      t.dataset.active = String(active);
      t.setAttribute("aria-selected", String(active));
    }
    root.dispatchEvent(
      new CustomEvent("tab:select", { bubbles: true, detail: { name: tab.dataset.tab } }),
    );
  }

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Vertical tabs — ARIA tablist with Up/Down roving-tabindex navigation.
 * Panels live in the panels slot; each carries data-tab-panel="<id>" matching a
 * tab's data-tab="<id>".
 */
export default function init(root, props) {
  const tabs = Array.from(root.querySelectorAll(".tabs-vertical__tab"));
  const panels = Array.from(root.querySelectorAll("[data-tab-panel]"));
  if (!tabs.length) return () => {};

  function select(tab, { focus = true } = {}) {
    for (const t of tabs) {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.dataset.active = String(active);
      t.tabIndex = active ? 0 : -1;
    }
    for (const p of panels) {
      p.toggleAttribute("hidden", p.dataset.tabPanel !== tab.dataset.tab);
    }
    if (focus) tab.focus();
    root.dispatchEvent(new CustomEvent("tabs:change", { bubbles: true, detail: { id: tab.dataset.tab } }));
  }

  function onClick(event) {
    const tab = event.target.closest(".tabs-vertical__tab");
    if (tab) select(tab, { focus: false });
  }
  function onKeydown(event) {
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = null;
    if (event.key === "ArrowDown") next = tabs[(idx + 1) % tabs.length];
    else if (event.key === "ArrowUp") next = tabs[(idx - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") next = tabs[0];
    else if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      select(next);
    }
  }

  const initial = tabs.find((t) => t.dataset.active === "true") || tabs[0];
  for (const t of tabs) t.tabIndex = t === initial ? 0 : -1;

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeydown);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeydown);
  };
}

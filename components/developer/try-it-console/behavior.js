/**
 * Try-it console — a skeleton request builder.
 * Wires the Params/Headers/Body tab row (click switches which panel is shown, tracking
 * data-active + aria-selected and a roving tabindex) and the Send button, which dispatches a
 * "console:send" CustomEvent carrying the current method and url so an integrating app can run
 * the request. The initial method is read from the root's data-method attribute and applied to
 * the method <select>. No real HTTP is performed — this is boilerplate for an agent to wire up.
 */
export default function init(root) {
  const tabs = Array.from(root.querySelectorAll(".try-it-console__tab"));
  const panels = Array.from(root.querySelectorAll("[data-console-panel]"));
  const method = root.querySelector(".try-it-console__method");
  const send = root.querySelector(".try-it-console__send");
  const url = root.querySelector(".try-it-console__url");

  if (method && root.dataset.method) method.value = root.dataset.method;

  function select(tab, { focus = true } = {}) {
    for (const t of tabs) {
      const on = t === tab;
      t.dataset.active = String(on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    for (const p of panels) {
      p.toggleAttribute("hidden", p.dataset.consolePanel !== tab.dataset.consoleTab);
    }
    if (focus) tab.focus();
  }

  function onClick(event) {
    const tab = event.target.closest(".try-it-console__tab");
    if (tab) {
      select(tab, { focus: false });
      return;
    }
    if (send && (event.target === send || send.contains(event.target))) {
      root.dispatchEvent(new CustomEvent("console:send", {
        bubbles: true,
        detail: { method: method ? method.value : "", url: url ? url.value : "" },
      }));
    }
  }

  function onKeydown(event) {
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = null;
    if (event.key === "ArrowRight") next = tabs[(idx + 1) % tabs.length];
    else if (event.key === "ArrowLeft") next = tabs[(idx - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") next = tabs[0];
    else if (event.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      event.preventDefault();
      select(next);
    }
  }

  // Establish the roving tabindex from the pre-marked active tab.
  const initial = tabs.find((t) => t.dataset.active === "true") || tabs[0];
  for (const t of tabs) t.tabIndex = t === initial ? 0 : -1;

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeydown);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeydown);
  };
}

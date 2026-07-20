/**
 * Code sample tabs - an ARIA tablist of language tabs over one code panel each, plus a copy button.
 * Config/state comes from the DOM (data-active marks the visible tab/panel); portable init passes
 * no props object. Clicking or arrowing to a tab shows its panel; the copy button copies the code
 * of whichever panel is currently active and briefly swaps its label to "Copied!".
 */
export default function init(root) {
  const tabs = Array.from(root.querySelectorAll(".code-sample-tabs__tab"));
  const panels = Array.from(root.querySelectorAll(".code-sample-tabs__panel"));
  if (!tabs.length) return () => {};
  const copyBtn = root.querySelector(".code-sample-tabs__copy");
  const copyLabel = root.querySelector(".code-sample-tabs__copy-label");

  function select(i, { focus = true } = {}) {
    tabs.forEach((t, idx) => {
      const on = idx === i;
      t.setAttribute("aria-selected", String(on));
      t.dataset.active = String(on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p, idx) => {
      p.dataset.active = String(idx === i);
    });
    root.dispatchEvent(new CustomEvent("code-sample-tabs:change", { bubbles: true, detail: { index: i } }));
  }

  function onClick(event) {
    const tab = event.target.closest(".code-sample-tabs__tab");
    if (!tab) return;
    const i = tabs.indexOf(tab);
    if (i > -1) select(i, { focus: false });
  }
  function onKeydown(event) {
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = -1;
    if (event.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next > -1) {
      event.preventDefault();
      select(next);
    }
  }

  let timer = 0;
  function onCopy() {
    const panel = panels.find((p) => p.dataset.active === "true") || panels[0];
    const code = panel ? panel.querySelector("code")?.textContent ?? "" : "";
    navigator.clipboard?.writeText(code)?.then(() => {
      if (copyLabel) copyLabel.textContent = "Copied!";
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (copyLabel) copyLabel.textContent = "Copy";
      }, 1500);
    });
  }

  // Establish roving tabindex from the pre-marked active tab.
  const initial = tabs.findIndex((t) => t.dataset.active === "true");
  const start = initial > -1 ? initial : 0;
  tabs.forEach((t, idx) => {
    t.tabIndex = idx === start ? 0 : -1;
  });

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeydown);
  copyBtn?.addEventListener("click", onCopy);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeydown);
    copyBtn?.removeEventListener("click", onCopy);
    clearTimeout(timer);
  };
}

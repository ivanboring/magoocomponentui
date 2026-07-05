/**
 * Accordion — each trigger toggles its panel; when data-single is true, opening one closes
 * the others. Keyboard: Up/Down move between triggers, Home/End jump to first/last.
 */
export default function init(root, props) {
  const single = root.dataset.single === "true";
  const triggers = () => Array.from(root.querySelectorAll(".accordion__trigger"));

  function setOpen(trigger, open) {
    trigger.setAttribute("aria-expanded", String(open));
    const panel = trigger.closest(".accordion__item").querySelector(".accordion__panel");
    panel.dataset.open = String(open);
    panel.classList.toggle("hidden", !open);
  }
  function onClick(event) {
    const trigger = event.target.closest(".accordion__trigger");
    if (!trigger) return;
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    if (single) triggers().forEach((t) => { if (t !== trigger) setOpen(t, false); });
    setOpen(trigger, willOpen);
  }
  function onKey(event) {
    const list = triggers();
    const idx = list.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = null;
    if (event.key === "ArrowDown") next = list[(idx + 1) % list.length];
    else if (event.key === "ArrowUp") next = list[(idx - 1 + list.length) % list.length];
    else if (event.key === "Home") next = list[0];
    else if (event.key === "End") next = list[list.length - 1];
    if (next) { event.preventDefault(); next.focus(); }
  }
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKey);
  };
}

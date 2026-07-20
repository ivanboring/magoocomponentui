/**
 * Snooze menu — a trigger button toggles an absolutely-positioned menu of snooze presets.
 * Open/closed state lives on the root's data-open attribute (the panel is revealed purely
 * by the group-data-[open=true] Tailwind variants); this behavior only flips that state and
 * mirrors it on aria-expanded. Choosing a preset (or "Pick date & time") dispatches
 * snooze:pick and closes. Closes on Escape or an outside click.
 */
export default function init(root) {
  const trigger = root.querySelector(".snooze-menu__trigger");
  const panel = root.querySelector(".snooze-menu__panel");
  if (!trigger || !panel) return () => {};

  const isOpen = () => root.dataset.open === "true";
  function open() {
    root.dataset.open = "true";
    trigger.setAttribute("aria-expanded", "true");
  }
  function close() {
    root.dataset.open = "false";
    trigger.setAttribute("aria-expanded", "false");
  }
  function toggle() {
    isOpen() ? close() : open();
  }

  function onPanelClick(event) {
    const option = event.target.closest(".snooze-menu__option");
    const pick = event.target.closest(".snooze-menu__pick");
    if (!option && !pick) return;
    const detail = pick
      ? { label: "Pick date & time", custom: true }
      : { label: option.dataset.label, when: option.dataset.when };
    root.dispatchEvent(new CustomEvent("snooze:pick", { bubbles: true, detail }));
    close();
    trigger.focus();
  }
  function onOutside(event) {
    if (!root.contains(event.target)) close();
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener("click", toggle);
  panel.addEventListener("click", onPanelClick);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    panel.removeEventListener("click", onPanelClick);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}

/**
 * Version selector - a listbox-style dropdown of doc/API versions.
 * Open state is the root's data-open attribute (CSS reveals the absolutely-positioned menu via
 * group-data-[open=true]); portable init passes no props object. Selecting a version updates the
 * trigger and the checked option, dispatches version:pick, and closes. Closes on Escape or outside
 * click; ArrowUp/Down move focus between options.
 */
export default function init(root) {
  const trigger = root.querySelector(".version-selector__trigger");
  const menu = root.querySelector(".version-selector__menu");
  const current = root.querySelector(".version-selector__current");
  if (!trigger || !menu) return () => {};

  const items = () => Array.from(menu.querySelectorAll(".version-selector__item"));

  function setOpen(open) {
    root.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
    if (open) items()[0]?.focus();
  }
  function close() {
    setOpen(false);
  }
  function toggle() {
    setOpen(root.dataset.open !== "true");
  }

  function onTriggerKey(event) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }
  function pick(item) {
    items().forEach((i) => {
      const on = i === item;
      i.dataset.current = String(on);
      i.setAttribute("aria-selected", String(on));
    });
    if (current) current.textContent = item.dataset.value;
    root.dispatchEvent(new CustomEvent("version:pick", { bubbles: true, detail: { value: item.dataset.value } }));
    close();
    trigger.focus();
  }
  function onClick(event) {
    const item = event.target.closest(".version-selector__item");
    if (item) pick(item);
  }
  function onOutside(event) {
    if (!root.contains(event.target)) close();
  }
  function onKey(event) {
    const list = items();
    const idx = list.indexOf(document.activeElement);
    if (event.key === "Escape") {
      close();
      trigger.focus();
    } else if (event.key === "ArrowDown" && idx > -1) {
      event.preventDefault();
      list[(idx + 1) % list.length].focus();
    } else if (event.key === "ArrowUp" && idx > -1) {
      event.preventDefault();
      list[(idx - 1 + list.length) % list.length].focus();
    }
  }

  trigger.addEventListener("click", toggle);
  trigger.addEventListener("keydown", onTriggerKey);
  root.addEventListener("click", onClick);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    trigger.removeEventListener("keydown", onTriggerKey);
    root.removeEventListener("click", onClick);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}

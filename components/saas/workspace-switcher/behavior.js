/**
 * Workspace switcher - an org/workspace dropdown.
 * Open state is the root's data-open attribute (CSS reveals the absolutely-positioned menu via
 * group-data-[open=true]); portable init passes no props object. Selecting a workspace updates the
 * trigger label and the checked option, dispatches workspace:switch, and closes. The "Create
 * workspace" footer button dispatches workspace:create. Closes on Escape or outside click;
 * ArrowUp/Down move focus between options.
 */
export default function init(root) {
  const trigger = root.querySelector(".workspace-switcher__trigger");
  const menu = root.querySelector(".workspace-switcher__menu");
  const current = root.querySelector(".workspace-switcher__current");
  const create = root.querySelector(".workspace-switcher__create");
  if (!trigger || !menu) return () => {};

  const items = () => Array.from(menu.querySelectorAll(".workspace-switcher__item"));

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
    root.dispatchEvent(new CustomEvent("workspace:switch", { bubbles: true, detail: { value: item.dataset.value } }));
    close();
    trigger.focus();
  }
  function onClick(event) {
    if (create && event.target.closest(".workspace-switcher__create")) {
      root.dispatchEvent(new CustomEvent("workspace:create", { bubbles: true }));
      close();
      trigger.focus();
      return;
    }
    const item = event.target.closest(".workspace-switcher__item");
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

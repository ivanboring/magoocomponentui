/**
 * Menubar — a desktop application menu bar. Clicking a top-level button opens its
 * panel (data-open="true") and closes the others; ArrowLeft/ArrowRight move between
 * buttons (opening as you go once any menu is open); ArrowDown focuses the first item
 * in the open panel; Escape and outside-click close everything. aria-expanded stays
 * in sync with each menu's open state.
 */
export default function init(root) {
  const menus = Array.from(root.querySelectorAll(".menubar__menu"));
  if (!menus.length) return () => {};

  const buttonOf = (menu) => menu.querySelector(".menubar__button");
  const isOpen = (menu) => menu.dataset.open === "true";

  function setOpen(menu, open) {
    menu.dataset.open = open ? "true" : "false";
    buttonOf(menu)?.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function closeAll() {
    menus.forEach((menu) => setOpen(menu, false));
  }
  function openOnly(menu) {
    menus.forEach((m) => setOpen(m, m === menu));
  }
  const anyOpen = () => menus.some(isOpen);

  function onButtonClick(event) {
    const menu = event.currentTarget.closest(".menubar__menu");
    if (isOpen(menu)) closeAll();
    else openOnly(menu);
  }

  function onKey(event) {
    const menu = event.currentTarget.closest(".menubar__menu");
    const index = menus.indexOf(menu);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const next = menus[(index + dir + menus.length) % menus.length];
      if (anyOpen()) openOnly(next);
      buttonOf(next)?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      openOnly(menu);
      menu.querySelector(".menubar__panel [role=menuitem]")?.focus();
    } else if (event.key === "Escape") {
      closeAll();
      buttonOf(menu)?.focus();
    }
  }

  function onPanelKey(event) {
    if (event.key !== "Escape") return;
    const menu = event.currentTarget.closest(".menubar__menu");
    closeAll();
    buttonOf(menu)?.focus();
  }

  function onOutside(event) {
    if (!root.contains(event.target)) closeAll();
  }

  const buttons = menus.map(buttonOf).filter(Boolean);
  const panels = menus.map((m) => m.querySelector(".menubar__panel")).filter(Boolean);
  buttons.forEach((button) => {
    button.addEventListener("click", onButtonClick);
    button.addEventListener("keydown", onKey);
  });
  panels.forEach((panel) => panel.addEventListener("keydown", onPanelKey));
  document.addEventListener("click", onOutside);

  return () => {
    buttons.forEach((button) => {
      button.removeEventListener("click", onButtonClick);
      button.removeEventListener("keydown", onKey);
    });
    panels.forEach((panel) => panel.removeEventListener("keydown", onPanelKey));
    document.removeEventListener("click", onOutside);
  };
}

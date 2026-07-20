/**
 * Combobox — a typeahead select. Typing filters the listbox case-insensitively by each
 * option's data-label (non-matches get data-hidden="true"); the toggle button opens the
 * list; clicking an option fills the input and closes; ArrowDown/ArrowUp move a
 * data-active highlight over the VISIBLE options (tracked via aria-activedescendant),
 * Enter selects the active one, Escape closes. Opens on focus, closes on outside click.
 * Fires combobox:select with the chosen { value, label }. Cleans up all listeners.
 */
export default function init(root) {
  const input = root.querySelector(".combobox__input");
  const toggle = root.querySelector(".combobox__toggle");
  const list = root.querySelector(".combobox__list");
  if (!input || !list) return () => {};

  const options = Array.from(list.querySelectorAll(".combobox__option"));
  // Give each option a stable id so aria-activedescendant can point at it.
  const baseId = (input.getAttribute("name") || "combobox").replace(/[^a-zA-Z0-9_-]/g, "-");
  options.forEach((el, i) => {
    if (!el.id) el.id = `${baseId}-option-${i}`;
  });

  const visibleOptions = () => options.filter((el) => el.dataset.hidden !== "true");

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    input.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) clearActive();
  }
  const isOpen = () => root.dataset.open === "true";

  function clearActive() {
    for (const el of options) el.dataset.active = "false";
    input.removeAttribute("aria-activedescendant");
  }
  function setActive(el) {
    for (const opt of options) opt.dataset.active = String(opt === el);
    if (el) {
      input.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function selectOption(el) {
    input.value = el.dataset.label || "";
    for (const opt of options) opt.setAttribute("aria-selected", String(opt === el));
    root.dispatchEvent(new CustomEvent("combobox:select", {
      bubbles: true,
      detail: { value: el.dataset.value, label: el.dataset.label },
    }));
    setOpen(false);
    input.focus();
  }

  function filter() {
    const q = input.value.trim().toLowerCase();
    for (const el of options) {
      const match = !q || (el.dataset.label || "").toLowerCase().includes(q);
      el.dataset.hidden = match ? "false" : "true";
    }
    setActive(visibleOptions()[0] || null);
  }

  function onInput() {
    filter();
    setOpen(true);
  }
  function onFocus() {
    setOpen(true);
  }
  function onToggleClick() {
    if (isOpen()) {
      setOpen(false);
    } else {
      setOpen(true);
      input.focus();
    }
  }
  function onListClick(event) {
    const el = event.target.closest(".combobox__option");
    if (el) selectOption(el);
  }
  function onKey(event) {
    const vis = visibleOptions();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen()) return setOpen(true);
      if (!vis.length) return;
      const idx = vis.findIndex((el) => el.dataset.active === "true");
      setActive(vis[(idx + 1) % vis.length]);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!vis.length) return;
      const idx = vis.findIndex((el) => el.dataset.active === "true");
      setActive(vis[(idx - 1 + vis.length) % vis.length]);
    } else if (event.key === "Enter") {
      const active = options.find((el) => el.dataset.active === "true" && el.dataset.hidden !== "true");
      if (isOpen() && active) {
        event.preventDefault();
        selectOption(active);
      }
    } else if (event.key === "Escape") {
      if (isOpen()) {
        event.preventDefault();
        setOpen(false);
      }
    }
  }
  function onOutside(event) {
    if (!root.contains(event.target)) setOpen(false);
  }

  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("keydown", onKey);
  toggle?.addEventListener("click", onToggleClick);
  list.addEventListener("click", onListClick);
  document.addEventListener("click", onOutside);

  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("keydown", onKey);
    toggle?.removeEventListener("click", onToggleClick);
    list.removeEventListener("click", onListClick);
    document.removeEventListener("click", onOutside);
  };
}

/**
 * Command palette — type-to-filter commands, ArrowUp/Down to move the active option,
 * Enter to select (fires command-palette:select), Escape/backdrop to close.
 */
export default function init(root, props) {
  const input = root.querySelector(".command-palette__input");
  const list = root.querySelector(".command-palette__list");
  const empty = root.querySelector("[data-command-empty]");
  if (!input || !list) return () => {};

  const allItems = () => Array.from(list.querySelectorAll(".command-palette__item"));
  const visibleItems = () => allItems().filter((el) => !el.hidden);

  function setActive(next) {
    for (const el of allItems()) el.setAttribute("aria-selected", String(el === next));
    next?.scrollIntoView({ block: "nearest" });
  }

  function filter() {
    const q = input.value.trim().toLowerCase();
    for (const el of allItems()) {
      el.hidden = q && !(el.dataset.label || "").toLowerCase().includes(q);
    }
    // Hide a group heading when all its commands are filtered out.
    for (const group of list.querySelectorAll("[data-group]")) {
      const anyVisible = group.querySelector(".command-palette__item:not([hidden])");
      group.hidden = !anyVisible;
    }
    const vis = visibleItems();
    if (empty) empty.classList.toggle("hidden", vis.length > 0);
    setActive(vis[0] || null);
  }

  function close() {
    root.dataset.open = "false";
    root.dispatchEvent(new CustomEvent("command-palette:close", { bubbles: true }));
  }
  function choose(item) {
    root.dispatchEvent(new CustomEvent("command-palette:select", { bubbles: true, detail: { value: item.dataset.value } }));
    close();
  }

  function onInput() { filter(); }
  function onKey(event) {
    const vis = visibleItems();
    const active = list.querySelector('.command-palette__item[aria-selected="true"]:not([hidden])');
    let idx = vis.indexOf(active);
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(vis[(idx + 1) % vis.length] || null); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(vis[(idx - 1 + vis.length) % vis.length] || null); }
    else if (event.key === "Enter" && active) { event.preventDefault(); choose(active); }
    else if (event.key === "Escape") { close(); }
  }
  function onClick(event) {
    if (event.target.closest("[data-command-close]")) return close();
    const item = event.target.closest(".command-palette__item");
    if (item) choose(item);
  }

  input.addEventListener("input", onInput);
  root.addEventListener("keydown", onKey);
  root.addEventListener("click", onClick);
  filter();
  input.focus();
  return () => {
    input.removeEventListener("input", onInput);
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("click", onClick);
  };
}

/**
 * Search autocomplete — filters the suggestion list as you type, opens/closes the listbox,
 * supports ArrowUp/Down + Enter, and closes on outside click or Escape. Emits
 * autocomplete:select with the chosen label.
 */
export default function init(root, props) {
  const input = root.querySelector(".search-autocomplete__input");
  const list = root.querySelector(".search-autocomplete__list");
  if (!input || !list) return () => {};
  const options = () => Array.from(list.querySelectorAll(".search-autocomplete__option"));
  const visible = () => options().filter((o) => !o.hidden);

  function open() { list.classList.remove("hidden"); list.classList.add("flex"); input.setAttribute("aria-expanded", "true"); }
  function close() { list.classList.add("hidden"); list.classList.remove("flex"); input.setAttribute("aria-expanded", "false"); setActive(null); }
  function setActive(opt) { options().forEach((o) => o.setAttribute("aria-selected", String(o === opt))); opt?.scrollIntoView({ block: "nearest" }); }

  function filter() {
    const q = input.value.trim().toLowerCase();
    for (const o of options()) o.hidden = q && !(o.dataset.label || "").toLowerCase().includes(q);
    const vis = visible();
    vis.length ? open() : close();
    setActive(vis[0] || null);
  }
  function choose(opt) {
    input.value = opt.dataset.label;
    close();
    root.dispatchEvent(new CustomEvent("autocomplete:select", { bubbles: true, detail: { value: opt.dataset.label } }));
  }
  function onKey(event) {
    const vis = visible();
    const active = list.querySelector('.search-autocomplete__option[aria-selected="true"]:not([hidden])');
    const idx = vis.indexOf(active);
    if (event.key === "ArrowDown") { event.preventDefault(); open(); setActive(vis[(idx + 1) % vis.length] || null); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(vis[(idx - 1 + vis.length) % vis.length] || null); }
    else if (event.key === "Enter" && active) { event.preventDefault(); choose(active); }
    else if (event.key === "Escape") close();
  }
  function onClick(event) { const opt = event.target.closest(".search-autocomplete__option"); if (opt) choose(opt); }
  function onOutside(event) { if (!root.contains(event.target)) close(); }
  function onFocus() { if (input.value) filter(); }

  input.addEventListener("input", filter);
  input.addEventListener("keydown", onKey);
  input.addEventListener("focus", onFocus);
  list.addEventListener("click", onClick);
  document.addEventListener("click", onOutside);
  return () => {
    input.removeEventListener("input", filter);
    input.removeEventListener("keydown", onKey);
    input.removeEventListener("focus", onFocus);
    list.removeEventListener("click", onClick);
    document.removeEventListener("click", onOutside);
  };
}

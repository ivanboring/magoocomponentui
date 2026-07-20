/**
 * Model picker — a trigger button opens a listbox of models. Selecting a row updates the
 * trigger label, marks the row selected, closes the menu, and dispatches "model:pick" with the
 * chosen name. Toggling flips the root's data-open (CSS reveals the panel via the
 * group-data-[open=true] variants) and syncs aria-expanded. Closes on Escape and outside click.
 * Cleanup removes every listener.
 */
export default function init(root) {
  const trigger = root.querySelector(".model-picker__trigger");
  const current = root.querySelector(".model-picker__current");
  if (!trigger) return () => {};
  const options = Array.from(root.querySelectorAll(".model-picker__option"));

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  const isOpen = () => root.dataset.open === "true";
  const toggle = () => setOpen(!isOpen());

  function select(option) {
    const name = option.dataset.value || "";
    options.forEach((o) => {
      const on = o === option;
      o.dataset.selected = on ? "true" : "false";
      o.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (current) current.textContent = name;
    root.dispatchEvent(new CustomEvent("model:pick", { bubbles: true, detail: { name } }));
    setOpen(false);
    trigger.focus();
  }

  function onOptionClick(event) {
    const option = event.target.closest(".model-picker__option");
    if (option) select(option);
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  }
  function onOutside(event) {
    if (!root.contains(event.target)) setOpen(false);
  }

  trigger.addEventListener("click", toggle);
  root.addEventListener("click", onOptionClick);
  root.addEventListener("keydown", onKey);
  document.addEventListener("click", onOutside);

  return () => {
    trigger.removeEventListener("click", toggle);
    root.removeEventListener("click", onOptionClick);
    root.removeEventListener("keydown", onKey);
    document.removeEventListener("click", onOutside);
  };
}

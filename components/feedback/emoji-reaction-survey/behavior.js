/**
 * Emoji reaction survey behavior — pick one sentiment.
 * Each option button carries a data-value and a data-selected that drives its highlight
 * (data-[selected=true]:...). Clicking an option selects it and clears the others, syncs
 * aria-checked, and dispatches a bubbling "emoji:react" CustomEvent with { value }.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const options = Array.from(root.querySelectorAll(".emoji-reaction-survey__option"));
  if (!options.length) return () => {};

  const select = (chosen) => {
    options.forEach((btn) => {
      const on = btn === chosen;
      btn.dataset.selected = on ? "true" : "false";
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    root.dispatchEvent(
      new CustomEvent("emoji:react", { bubbles: true, detail: { value: chosen.dataset.value } })
    );
  };

  const handlers = options.map((btn) => {
    const h = () => select(btn);
    btn.addEventListener("click", h);
    // Reflect any preset selected state into aria-checked.
    btn.setAttribute("aria-checked", btn.dataset.selected === "true" ? "true" : "false");
    return h;
  });

  return () => {
    options.forEach((btn, i) => btn.removeEventListener("click", handlers[i]));
  };
}

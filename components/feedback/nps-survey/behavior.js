/**
 * NPS survey behavior — pick a 0-10 recommend score.
 * The selected number is highlighted purely by the root's data-value attribute (group-data
 * variants on each button), so the initial `value` renders with no JavaScript. Clicking a
 * number sets data-value (clearing any previous selection), syncs aria-checked, and dispatches
 * a bubbling "nps:rate" CustomEvent with { score } (the number as an integer).
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".nps-survey__btn"));
  if (!buttons.length) return () => {};

  function sync() {
    const value = root.dataset.value || "";
    buttons.forEach((btn) => {
      btn.setAttribute("aria-checked", btn.dataset.value === value ? "true" : "false");
    });
  }
  function pick(btn) {
    return () => {
      root.dataset.value = btn.dataset.value;
      sync();
      root.dispatchEvent(
        new CustomEvent("nps:rate", { bubbles: true, detail: { score: Number(btn.dataset.value) } })
      );
    };
  }

  const handlers = buttons.map((btn) => {
    const h = pick(btn);
    btn.addEventListener("click", h);
    return h;
  });
  sync();

  return () => {
    buttons.forEach((btn, i) => btn.removeEventListener("click", handlers[i]));
  };
}

/**
 * Survey question behavior — toggle option selection, respecting the answer kind.
 * Each option button carries a data-value and a data-selected that drives its highlight
 * (data-[selected=true]:...). The root's data-kind steers the logic: "single" clears the other
 * options when one is chosen; "multi" and "scale" toggle each option independently. Every change
 * dispatches a bubbling "survey:answer" CustomEvent with { value, selected, values } where values
 * is the full list of currently selected keys.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const options = Array.from(root.querySelectorAll(".survey-question__option"));
  if (!options.length) return () => {};
  const single = (root.dataset.kind || "single") === "single";

  const setSelected = (btn, on) => {
    btn.dataset.selected = on ? "true" : "false";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  };
  const selectedValues = () =>
    options.filter((b) => b.dataset.selected === "true").map((b) => b.dataset.value);

  const handlers = options.map((btn) => {
    const h = () => {
      const next = btn.dataset.selected !== "true";
      if (single) {
        options.forEach((other) => setSelected(other, other === btn && next));
      } else {
        setSelected(btn, next);
      }
      root.dispatchEvent(
        new CustomEvent("survey:answer", {
          bubbles: true,
          detail: { value: btn.dataset.value, selected: btn.dataset.selected === "true", values: selectedValues() },
        })
      );
    };
    btn.addEventListener("click", h);
    return h;
  });

  return () => {
    options.forEach((btn, i) => btn.removeEventListener("click", handlers[i]));
  };
}

/**
 * Feedback thumbs behavior — pick up/down, toggle off on re-click, and emit the rating.
 * The chosen value lives on the root's data-value attribute (which drives the CSS highlight via
 * group-data variants). Clicking a thumb sets or clears it, syncs aria-pressed, and dispatches a
 * bubbling "feedback:rate" CustomEvent with { value }.
 */
export default function init(root) {
  const up = root.querySelector(".feedback-thumbs__up");
  const down = root.querySelector(".feedback-thumbs__down");

  function sync() {
    const value = root.dataset.value || "";
    if (up) up.setAttribute("aria-pressed", value === "up" ? "true" : "false");
    if (down) down.setAttribute("aria-pressed", value === "down" ? "true" : "false");
  }
  function pick(choice) {
    return () => {
      root.dataset.value = root.dataset.value === choice ? "" : choice;
      sync();
      root.dispatchEvent(new CustomEvent("feedback:rate", { bubbles: true, detail: { value: root.dataset.value } }));
    };
  }

  const onUp = pick("up");
  const onDown = pick("down");
  up?.addEventListener("click", onUp);
  down?.addEventListener("click", onDown);
  sync();

  return () => {
    up?.removeEventListener("click", onUp);
    down?.removeEventListener("click", onDown);
  };
}

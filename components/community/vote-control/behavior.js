/**
 * Vote control behavior — pick up/down, toggle off on re-click, and emit the vote.
 * The chosen vote lives on the root's data-vote attribute, which drives the CSS highlight via
 * group-data variants. Clicking an arrow sets or clears it, syncs aria-pressed on both buttons, and
 * dispatches a bubbling "vote:change" CustomEvent with { vote }. Config comes from the DOM only.
 */
export default function init(root) {
  const up = root.querySelector(".vote-control__up");
  const down = root.querySelector(".vote-control__down");

  function sync() {
    const vote = root.dataset.vote || "";
    if (up) up.setAttribute("aria-pressed", vote === "up" ? "true" : "false");
    if (down) down.setAttribute("aria-pressed", vote === "down" ? "true" : "false");
  }
  function pick(choice) {
    return () => {
      root.dataset.vote = root.dataset.vote === choice ? "" : choice;
      sync();
      root.dispatchEvent(new CustomEvent("vote:change", { bubbles: true, detail: { vote: root.dataset.vote } }));
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

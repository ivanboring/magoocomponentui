/**
 * Device group card — the master switch turns the whole group on or off, flipping data-state on the
 * button and its knob (and aria-checked) and emitting a bubbling "group:toggle" with the new state.
 * State is read from the DOM (portable init passes no props object).
 */
export default function init(root) {
  const sw = root.querySelector(".device-group-card__switch");
  if (!sw) return () => {};

  function onClick() {
    const allOn = sw.dataset.state !== "true";
    root.querySelectorAll("[data-state]").forEach((el) => { el.dataset.state = String(allOn); });
    sw.setAttribute("aria-checked", String(allOn));
    root.dispatchEvent(new CustomEvent("group:toggle", { bubbles: true, detail: { all_on: allOn } }));
  }

  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}

/**
 * Schedule timer — the switch enables/disables the schedule, flipping data-state on the button and
 * its knob (and aria-checked) and emitting a bubbling "timer:toggle" with the new enabled state.
 * State is read from the DOM (portable init passes no props object).
 */
export default function init(root) {
  const sw = root.querySelector(".schedule-timer__switch");
  if (!sw) return () => {};

  function onClick() {
    const enabled = sw.dataset.state !== "true";
    root.querySelectorAll("[data-state]").forEach((el) => { el.dataset.state = String(enabled); });
    sw.setAttribute("aria-checked", String(enabled));
    root.dispatchEvent(new CustomEvent("timer:toggle", { bubbles: true, detail: { enabled } }));
  }

  sw.addEventListener("click", onClick);
  return () => sw.removeEventListener("click", onClick);
}

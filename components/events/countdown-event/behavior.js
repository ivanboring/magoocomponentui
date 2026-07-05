/**
 * Event countdown — ticks down to data-deadline (ISO), updating day/hour/minute/second
 * cells each second. Stops at zero and emits countdown:complete.
 */
export default function init(root, props) {
  const deadline = new Date(root.dataset.deadline).getTime();
  const days = root.querySelector(".countdown-event__days");
  const hours = root.querySelector(".countdown-event__hours");
  const minutes = root.querySelector(".countdown-event__minutes");
  const seconds = root.querySelector(".countdown-event__seconds");
  if (!days || Number.isNaN(deadline)) return () => {};
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const diff = Math.max(0, deadline - Date.now());
    const s = Math.floor(diff / 1000);
    days.textContent = pad(Math.floor(s / 86400));
    hours.textContent = pad(Math.floor((s % 86400) / 3600));
    minutes.textContent = pad(Math.floor((s % 3600) / 60));
    seconds.textContent = pad(s % 60);
    if (diff <= 0) { clearInterval(timer); root.dispatchEvent(new CustomEvent("countdown:complete", { bubbles: true })); }
  }
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}

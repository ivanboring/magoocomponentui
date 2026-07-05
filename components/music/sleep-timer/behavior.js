/**
 * Sleep timer — selecting a preset starts a countdown shown in the header; emits
 * sleeptimer:set / sleeptimer:complete. "Off" (minutes 0) cancels.
 */
export default function init(root, props) {
  const remaining = root.querySelector(".sleep-timer__remaining");
  let endAt = 0, raf;
  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} remaining`;
  };
  function tick() {
    const left = endAt - Date.now();
    if (remaining) remaining.textContent = left > 0 ? fmt(left) : "";
    if (left <= 0) { cancelAnimationFrame(raf); root.dispatchEvent(new CustomEvent("sleeptimer:complete", { bubbles: true })); return; }
    raf = requestAnimationFrame(tick);
  }
  function onClick(event) {
    const preset = event.target.closest(".sleep-timer__preset");
    if (!preset) return;
    root.querySelectorAll(".sleep-timer__preset").forEach((p) => {
      const on = p === preset;
      p.dataset.active = String(on);
      p.setAttribute("aria-checked", String(on));
    });
    cancelAnimationFrame(raf);
    const minutes = Number(preset.dataset.minutes) || 0;
    if (minutes > 0) { endAt = Date.now() + minutes * 60000; tick(); }
    else if (remaining) remaining.textContent = "";
    root.dispatchEvent(new CustomEvent("sleeptimer:set", { bubbles: true, detail: { minutes } }));
  }
  root.addEventListener("click", onClick);
  return () => { root.removeEventListener("click", onClick); cancelAnimationFrame(raf); };
}

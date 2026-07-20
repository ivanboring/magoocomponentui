/**
 * Time on site — a count-up timer with Start, Pause and Stop.
 *
 * The visible display carries the initial elapsed time (formatted MM:SS or HH:MM:SS); on init the
 * behavior parses it back to seconds so it can keep counting from there. Start begins a 1s interval
 * that increments and re-renders the display, Pause stops it, Stop stops it and dispatches a
 * "timer:stop" CustomEvent with { seconds }. The status badge follows data-status on the root (its
 * colour is pure CSS via group-data variants). If the root loads with data-status="running" the
 * timer starts immediately. Config is all in the markup; no props object is passed.
 *
 * Screenshots do not run behavior.js, so the timer shows its initial elapsed value there statically.
 */
export default function init(root) {
  const display = root.querySelector(".time-on-site__display");
  if (!display) return () => {};
  const startBtn = root.querySelector(".time-on-site__start");
  const pauseBtn = root.querySelector(".time-on-site__pause");
  const stopBtn = root.querySelector(".time-on-site__stop");
  const label = root.querySelector(".time-on-site__status-label");

  const parse = (text) => {
    const parts = String(text).trim().split(":").map((n) => parseInt(n, 10));
    if (!parts.length || parts.some((n) => Number.isNaN(n))) return 0;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  };
  const pad = (n) => String(n).padStart(2, "0");
  const format = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  let seconds = parse(display.textContent);
  let timer = 0;

  const setStatus = (status) => {
    root.dataset.status = status;
    if (label) label.textContent = status;
  };
  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
  };
  const tick = () => {
    seconds += 1;
    display.textContent = format(seconds);
  };
  const start = () => {
    if (timer) return;
    setStatus("running");
    timer = setInterval(tick, 1000);
  };
  const pause = () => {
    stopTimer();
    setStatus("paused");
  };
  const stop = () => {
    stopTimer();
    setStatus("complete");
    root.dispatchEvent(new CustomEvent("timer:stop", { bubbles: true, detail: { seconds } }));
  };

  startBtn?.addEventListener("click", start);
  pauseBtn?.addEventListener("click", pause);
  stopBtn?.addEventListener("click", stop);

  if (root.dataset.status === "running") start();

  return () => {
    stopTimer();
    startBtn?.removeEventListener("click", start);
    pauseBtn?.removeEventListener("click", pause);
    stopBtn?.removeEventListener("click", stop);
  };
}

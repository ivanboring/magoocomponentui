/**
 * Workout timer — a work/rest interval countdown over a number of rounds.
 *
 * Config comes from data-* attributes on the root (the portable init passes no props object):
 *   data-work   — work interval length in seconds
 *   data-rest   — rest interval length in seconds (0 skips rest)
 *   data-rounds — number of work/rest rounds
 *
 * Start/Pause/Reset drive a 1-second interval. Each time the phase changes (work -> rest,
 * rest -> next work, or the whole session finishing) a "timer:phase" CustomEvent is dispatched
 * from the root with detail { phase, round, rounds }. The interval and all listeners are torn
 * down on cleanup.
 */
export default function init(root) {
  const phaseEl = root.querySelector(".workout-timer__phase");
  const timeEl = root.querySelector(".workout-timer__time");
  const roundEl = root.querySelector(".workout-timer__round");
  const startBtn = root.querySelector(".workout-timer__start");
  const pauseBtn = root.querySelector(".workout-timer__pause");
  const resetBtn = root.querySelector(".workout-timer__reset");

  const work = Math.max(1, parseInt(root.dataset.work, 10) || 45);
  const rest = Math.max(0, parseInt(root.dataset.rest, 10) || 0);
  const rounds = Math.max(1, parseInt(root.dataset.rounds, 10) || 1);

  let phase = "work"; // "work" | "rest" | "done"
  let round = 1;
  let remaining = work;
  let timer = 0;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  const render = () => {
    root.dataset.phase = phase;
    if (phaseEl) phaseEl.textContent = phase === "work" ? "Work" : phase === "rest" ? "Rest" : "Done";
    if (timeEl) timeEl.textContent = fmt(remaining);
    if (roundEl) {
      const shown = Math.min(round, rounds);
      roundEl.innerHTML =
        `Round <span class="tabular-nums">${shown}</span> of <span class="tabular-nums">${rounds}</span>`;
    }
  };

  const emit = () => {
    root.dispatchEvent(
      new CustomEvent("timer:phase", { bubbles: true, detail: { phase, round, rounds } }),
    );
  };

  const stopInterval = () => {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
  };

  const finish = () => {
    stopInterval();
    phase = "done";
    remaining = 0;
    render();
    emit();
  };

  const advance = () => {
    if (phase === "work") {
      if (rest > 0) {
        phase = "rest";
        remaining = rest;
        render();
        emit();
        return;
      }
      // no rest configured — fall through to the next round
    }
    // phase was "rest" (or work with no rest): move to the next round's work
    if (round < rounds) {
      round += 1;
      phase = "work";
      remaining = work;
      render();
      emit();
      return;
    }
    finish();
  };

  const tick = () => {
    if (remaining > 0) {
      remaining -= 1;
      render();
    }
    if (remaining <= 0) advance();
  };

  const start = () => {
    if (timer) return;
    if (phase === "done") reset(); // restart a finished session
    timer = setInterval(tick, 1000);
  };
  const pause = () => stopInterval();
  const reset = () => {
    stopInterval();
    phase = "work";
    round = 1;
    remaining = work;
    render();
  };

  startBtn?.addEventListener("click", start);
  pauseBtn?.addEventListener("click", pause);
  resetBtn?.addEventListener("click", reset);

  render();

  return () => {
    stopInterval();
    startBtn?.removeEventListener("click", start);
    pauseBtn?.removeEventListener("click", pause);
    resetBtn?.removeEventListener("click", reset);
  };
}

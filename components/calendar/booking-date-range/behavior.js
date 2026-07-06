/**
 * Booking date-range behavior — interactive click + drag range selection.
 *
 * The markup ships a *precomputed* range (per-day `data-state`); this behavior seeds
 * the live selection from that render, then lets the user pick a new range by either
 * clicking a start day and then an end day, or pressing and dragging across the grid.
 * Keyboard: Tab to a day, Enter/Space to pick start, then end.
 *
 * Emitted events (both bubble; `detail` shape below):
 *   - "booking-date-range:change"       fired on every selection change (start pick,
 *                                        drag move, end pick). `complete` tells you
 *                                        whether a full start→end range is set.
 *   - "booking-date-range:rangeselected" fired only when a full range is committed
 *                                        (second click or drag release).
 *
 *   detail = {
 *     start:    { index, day } | null,   // index = cell position, day = number label
 *     end:      { index, day } | null,
 *     nights:   number,                  // end.index - start.index (0 until complete)
 *     complete: boolean                  // both start and end are set
 *   }
 */
export default function init(root) {
  const cellEls = Array.from(root.querySelectorAll(".booking-date-range__cell"));
  if (!cellEls.length) return () => {};

  const cells = cellEls.map((cell) => {
    const btn = cell.querySelector(".booking-date-range__day");
    const state = btn ? btn.dataset.state : "disabled";
    const muted = btn ? btn.dataset.muted === "true" : true;
    return {
      cell,
      btn,
      number: btn ? btn.textContent.trim() : "",
      disabled: state === "disabled",
      selectable: state !== "disabled" && !muted,
    };
  });

  const summaryEl = root.querySelector(".booking-date-range__summary");

  // Seed the live selection from the pre-rendered per-day state.
  let startIdx = cells.findIndex((c) => c.btn && c.btn.dataset.state === "start");
  let endIdx = cells.findIndex((c) => c.btn && c.btn.dataset.state === "end");
  if (startIdx < 0) startIdx = null;
  if (endIdx < 0) endIdx = null;

  let pressing = false;
  let pressAnchor = null;

  function paint() {
    cells.forEach((c, i) => {
      if (!c.btn || c.disabled) return;
      let state = "idle";
      if (c.selectable) {
        if (startIdx !== null && i === startIdx) state = "start";
        else if (endIdx !== null && i === endIdx) state = "end";
        else if (startIdx !== null && endIdx !== null && i > startIdx && i < endIdx) state = "in-range";
      }
      c.cell.dataset.state = state;
      c.btn.dataset.state = state;
    });
  }

  function buildDetail() {
    const complete = startIdx !== null && endIdx !== null;
    return {
      start: startIdx === null ? null : { index: startIdx, day: cells[startIdx].number },
      end: endIdx === null ? null : { index: endIdx, day: cells[endIdx].number },
      nights: complete ? endIdx - startIdx : 0,
      complete,
    };
  }

  function updateSummary(detail) {
    if (!summaryEl) return;
    if (detail.complete) {
      const n = detail.nights;
      summaryEl.textContent = `${detail.start.day} – ${detail.end.day} · ${n} night${n === 1 ? "" : "s"}`;
    } else if (detail.start) {
      summaryEl.textContent = `${detail.start.day} · select checkout`;
    } else {
      summaryEl.textContent = "";
    }
  }

  function emit(name) {
    const detail = buildDetail();
    updateSummary(detail);
    root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  }

  function idxOf(btn) {
    return cells.findIndex((c) => c.btn === btn);
  }

  function down(i) {
    if (i < 0 || !cells[i].selectable) return;
    if (startIdx === null || endIdx !== null) {
      // Begin a fresh range.
      startIdx = i;
      endIdx = null;
      pressAnchor = i;
    } else {
      // We already have a start with no end — this pick closes the range.
      pressAnchor = startIdx;
      startIdx = Math.min(pressAnchor, i);
      endIdx = Math.max(pressAnchor, i);
    }
    pressing = true;
    paint();
    emit("booking-date-range:change");
  }

  function enter(i) {
    if (!pressing || i < 0 || !cells[i].selectable) return;
    const a = Math.min(pressAnchor, i);
    const b = Math.max(pressAnchor, i);
    startIdx = a;
    endIdx = a === b ? null : b;
    paint();
    emit("booking-date-range:change");
  }

  function up() {
    if (!pressing) return;
    pressing = false;
    if (startIdx !== null && endIdx !== null) emit("booking-date-range:rangeselected");
  }

  function onPointerDown(event) {
    event.preventDefault();
    down(idxOf(event.currentTarget));
  }
  function onPointerEnter(event) {
    enter(idxOf(event.currentTarget));
  }
  function onKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    event.preventDefault();
    const i = idxOf(event.currentTarget);
    down(i);
    up();
  }

  const bound = [];
  cells.forEach((c) => {
    if (!c.btn || !c.selectable) return;
    c.btn.addEventListener("pointerdown", onPointerDown);
    c.btn.addEventListener("pointerenter", onPointerEnter);
    c.btn.addEventListener("keydown", onKeyDown);
    bound.push(c.btn);
  });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  paint();

  return () => {
    bound.forEach((btn) => {
      btn.removeEventListener("pointerdown", onPointerDown);
      btn.removeEventListener("pointerenter", onPointerEnter);
      btn.removeEventListener("keydown", onKeyDown);
    });
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
  };
}

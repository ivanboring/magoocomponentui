/**
 * Split pane — a draggable divider that resizes two panes.
 *
 * The start pane's width is a CSS custom property (--sp) set from the ratio prop, so the base
 * (no-JS) render already shows the correct split. This behavior lets the divider drag it live:
 * pointer drag (and ArrowLeft/ArrowRight when the divider is focused) updates the start pane's
 * flex-basis as a percentage, clamped to 15-85%. Pointer Events + setPointerCapture keep the drag
 * tracking even when the pointer leaves the thin divider. Config comes from the DOM; the portable
 * init passes no props object.
 */
export default function init(root) {
  const startPane = root.querySelector(".split-pane__start");
  const divider = root.querySelector(".split-pane__divider");
  if (!startPane || !divider) return () => {};

  const MIN = 15;
  const MAX = 85;
  const clamp = (p) => Math.min(MAX, Math.max(MIN, p));

  const currentPct = () => {
    const inline = parseFloat(startPane.style.flexBasis);
    if (!Number.isNaN(inline)) return inline;
    const w = root.clientWidth || 1;
    return (startPane.getBoundingClientRect().width / w) * 100 || 50;
  };

  function apply(p) {
    const v = clamp(p);
    startPane.style.flexBasis = v + "%";
    divider.setAttribute("aria-valuenow", String(Math.round(v)));
  }

  function pctFromEvent(event) {
    const rect = root.getBoundingClientRect();
    return ((event.clientX - rect.left) / (rect.width || 1)) * 100;
  }

  let dragging = false;
  function onPointerDown(event) {
    dragging = true;
    divider.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }
  function onPointerMove(event) {
    if (!dragging) return;
    apply(pctFromEvent(event));
  }
  function onPointerUp(event) {
    dragging = false;
    divider.releasePointerCapture?.(event.pointerId);
  }
  function onKeyDown(event) {
    if (event.key === "ArrowLeft") {
      apply(currentPct() - 2);
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      apply(currentPct() + 2);
      event.preventDefault();
    }
  }

  divider.addEventListener("pointerdown", onPointerDown);
  divider.addEventListener("pointermove", onPointerMove);
  divider.addEventListener("pointerup", onPointerUp);
  divider.addEventListener("keydown", onKeyDown);

  return () => {
    divider.removeEventListener("pointerdown", onPointerDown);
    divider.removeEventListener("pointermove", onPointerMove);
    divider.removeEventListener("pointerup", onPointerUp);
    divider.removeEventListener("keydown", onKeyDown);
  };
}

/**
 * Resizable panel — a draggable edge handle that resizes the panel.
 *
 * The panel ships with a sensible default size (w-72 / h-64) so the base (no-JS) render already
 * looks correct. This behavior drags one edge: with edge="right" the handle changes the panel's
 * width; with edge="bottom" it changes its height. Pointer Events + setPointerCapture keep the drag
 * tracking off the thin handle; sizes are clamped. Config comes from the data-edge attribute; the
 * portable init passes no props object.
 */
export default function init(root) {
  const handle = root.querySelector(".resizable-panel__handle");
  if (!handle) return () => {};
  const edge = root.dataset.edge === "bottom" ? "bottom" : "right";

  const MIN_W = 160;
  const MAX_W = 640;
  const MIN_H = 120;
  const MAX_H = 560;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;

  function onPointerDown(event) {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    const rect = root.getBoundingClientRect();
    startW = rect.width;
    startH = rect.height;
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }
  function onPointerMove(event) {
    if (!dragging) return;
    if (edge === "right") {
      root.style.width = clamp(startW + (event.clientX - startX), MIN_W, MAX_W) + "px";
    } else {
      root.style.height = clamp(startH + (event.clientY - startY), MIN_H, MAX_H) + "px";
    }
  }
  function onPointerUp(event) {
    dragging = false;
    handle.releasePointerCapture?.(event.pointerId);
  }

  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);

  return () => {
    handle.removeEventListener("pointerdown", onPointerDown);
    handle.removeEventListener("pointermove", onPointerMove);
    handle.removeEventListener("pointerup", onPointerUp);
  };
}

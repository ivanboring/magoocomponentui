/**
 * Before/after image comparison — drag the handle (pointer) or use Arrow keys to move
 * the reveal line. The before image is clipped to the handle position.
 */
export default function init(root, props) {
  const before = root.querySelector(".image-compare__before");
  const handle = root.querySelector(".image-compare__handle");
  const grip = root.querySelector(".image-compare__grip");
  if (!before || !handle || !grip) return () => {};
  let dragging = false;

  function setPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    before.style.width = clamped + "%";
    handle.style.left = clamped + "%";
    grip.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }
  function fromClientX(clientX) {
    const rect = root.getBoundingClientRect();
    setPct(((clientX - rect.left) / rect.width) * 100);
  }
  function onDown(event) { dragging = true; fromClientX(event.clientX ?? event.touches?.[0]?.clientX ?? 0); }
  function onMove(event) { if (dragging) fromClientX(event.clientX ?? event.touches?.[0]?.clientX ?? 0); }
  function onUp() { dragging = false; }
  function onKey(event) {
    const now = Number(grip.getAttribute("aria-valuenow")) || 50;
    if (event.key === "ArrowRight") { event.preventDefault(); setPct(now + 4); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setPct(now - 4); }
  }

  root.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  grip.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    grip.removeEventListener("keydown", onKey);
  };
}

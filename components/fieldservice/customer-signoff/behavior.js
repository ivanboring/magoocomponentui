/**
 * Customer sign-off — freehand signature on a <canvas> via Pointer Events, with Clear and Confirm.
 *
 * pointerdown starts a stroke (with setPointerCapture so a drag that leaves the canvas keeps
 * drawing), pointermove extends it, pointerup/cancel ends it. The backing store is sized to the
 * canvas box times devicePixelRatio on init so lines stay crisp. Clear wipes the canvas; Confirm
 * exports a PNG data URL and dispatches a "signoff:confirm" CustomEvent with { empty, dataUrl }.
 * Config is all in the markup; no props object is passed.
 *
 * Screenshots do not run behavior.js, so the pad shows empty and framed there, which is expected.
 */
export default function init(root) {
  const canvas = root.querySelector(".customer-signoff__canvas");
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const clearBtn = root.querySelector(".customer-signoff__clear");
  const confirmBtn = root.querySelector(".customer-signoff__confirm");

  let hasInk = false;
  let drawing = false;

  const configureContext = () => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = getComputedStyle(canvas).color || "#111827";
  };

  const sizeBackingStore = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    configureContext();
  };
  sizeBackingStore();

  const posOf = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event) => {
    drawing = true;
    hasInk = true;
    canvas.setPointerCapture?.(event.pointerId);
    const p = posOf(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    event.preventDefault();
  };
  const onPointerMove = (event) => {
    if (!drawing) return;
    const p = posOf(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    event.preventDefault();
  };
  const onPointerUp = (event) => {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false;
  };
  const onClear = () => clear();
  clearBtn?.addEventListener("click", onClear);

  const onConfirm = () => {
    const dataUrl = hasInk ? canvas.toDataURL("image/png") : "";
    root.dispatchEvent(
      new CustomEvent("signoff:confirm", { bubbles: true, detail: { empty: !hasInk, dataUrl } })
    );
  };
  confirmBtn?.addEventListener("click", onConfirm);

  // Resizing invalidates the backing store; re-fit and reset for a clean skeleton behavior.
  const onResize = () => {
    sizeBackingStore();
    hasInk = false;
  };
  window.addEventListener("resize", onResize);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    clearBtn?.removeEventListener("click", onClear);
    confirmBtn?.removeEventListener("click", onConfirm);
    window.removeEventListener("resize", onResize);
  };
}

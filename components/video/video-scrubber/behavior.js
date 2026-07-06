/**
 * Standalone video scrubber — click or Arrow keys move the played position and emit
 * scrubber:seek with the percentage. Buffered range is display-only.
 *
 * When given a sync_id (data-sync-id) it also binds to the video-player of that id over a
 * document-level bus: seeking dispatches mediasync:seek {id, percent}, and the played
 * range follows the player's mediasync:time broadcasts.
 */
export default function init(root, props) {
  const track = root.querySelector(".video-scrubber__track");
  const played = root.querySelector(".video-scrubber__played");
  const thumb = root.querySelector(".video-scrubber__thumb");
  if (!track || !played) return () => {};
  const syncId = root.dataset.syncId || "";

  // Move the played range + thumb + aria without emitting a seek (used when following a player).
  function renderPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    played.style.width = clamped + "%";
    if (thumb) thumb.style.left = clamped + "%";
    track.setAttribute("aria-valuenow", String(Math.round(clamped)));
    return clamped;
  }
  function setPct(pct) {
    const clamped = renderPct(pct);
    root.dispatchEvent(new CustomEvent("scrubber:seek", { bubbles: true, detail: { percent: clamped } }));
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:seek", { detail: { id: syncId, percent: clamped } }));
  }
  function onClick(event) {
    const rect = track.getBoundingClientRect();
    setPct(((event.clientX - rect.left) / rect.width) * 100);
  }
  function onKey(event) {
    const now = Number(track.getAttribute("aria-valuenow")) || 0;
    if (event.key === "ArrowRight") { event.preventDefault(); setPct(now + 5); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setPct(now - 5); }
  }
  // Follow the bound player's position.
  function onSyncTime(event) {
    const d = event.detail;
    if (!syncId || !d || d.id !== syncId || typeof d.percent !== "number") return;
    renderPct(d.percent);
  }
  track.addEventListener("click", onClick);
  track.addEventListener("keydown", onKey);
  if (syncId) document.addEventListener("mediasync:time", onSyncTime);
  return () => {
    track.removeEventListener("click", onClick);
    track.removeEventListener("keydown", onKey);
    if (syncId) document.removeEventListener("mediasync:time", onSyncTime);
  };
}

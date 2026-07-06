/**
 * Video chapters — clicking a chapter emits chapters:seek with its start seconds and
 * marks it active.
 *
 * When given a sync_id (data-sync-id) it binds to the video-player of that id over a
 * document-level bus: clicking a chapter dispatches mediasync:seek {id, seconds}, and the
 * active chapter follows the player's mediasync:time broadcasts.
 */
export default function init(root, props) {
  const syncId = root.dataset.syncId || "";

  function activate(item) {
    root.querySelectorAll(".video-chapters__item").forEach((c) => {
      const on = c === item;
      c.dataset.active = String(on);
      c.setAttribute("aria-current", String(on));
    });
  }
  function onClick(event) {
    const item = event.target.closest(".video-chapters__item");
    if (!item) return;
    activate(item);
    const seconds = Number(item.dataset.seconds);
    root.dispatchEvent(new CustomEvent("chapters:seek", { bubbles: true, detail: { seconds } }));
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:seek", { detail: { id: syncId, seconds } }));
  }
  // Follow the bound player: highlight the last chapter whose start is at or before the time.
  function onSyncTime(event) {
    const d = event.detail;
    if (!syncId || !d || d.id !== syncId || typeof d.currentTime !== "number") return;
    let current = null;
    root.querySelectorAll(".video-chapters__item").forEach((c) => {
      if (Number(c.dataset.seconds) <= d.currentTime) current = c;
    });
    if (current) activate(current);
  }
  root.addEventListener("click", onClick);
  if (syncId) document.addEventListener("mediasync:time", onSyncTime);
  return () => {
    root.removeEventListener("click", onClick);
    if (syncId) document.removeEventListener("mediasync:time", onSyncTime);
  };
}

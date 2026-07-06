/**
 * Video transcript — clicking a cue emits transcript:seek with its seconds and marks it
 * active. A player can listen and seek; the transcript can also be driven externally by
 * setting data-active on cues.
 *
 * When given a sync_id (data-sync-id) it binds to the video-player of that id over a
 * document-level bus: clicking a cue dispatches mediasync:seek {id, seconds}, and the
 * active cue follows the player's mediasync:time broadcasts.
 */
export default function init(root, props) {
  const syncId = root.dataset.syncId || "";

  function activate(cue) {
    root.querySelectorAll(".video-transcript__cue").forEach((c) => {
      const on = c === cue;
      c.dataset.active = String(on);
      c.setAttribute("aria-current", String(on));
      c.querySelector(".video-transcript__text").dataset.active = String(on);
    });
  }
  function onClick(event) {
    const cue = event.target.closest(".video-transcript__cue");
    if (cue) {
      activate(cue);
      const seconds = Number(cue.dataset.seconds);
      root.dispatchEvent(new CustomEvent("transcript:seek", { bubbles: true, detail: { seconds } }));
      if (syncId) document.dispatchEvent(new CustomEvent("mediasync:seek", { detail: { id: syncId, seconds } }));
    }
  }
  // Follow the bound player: highlight the last cue whose start is at or before the time.
  function onSyncTime(event) {
    const d = event.detail;
    if (!syncId || !d || d.id !== syncId || typeof d.currentTime !== "number") return;
    let current = null;
    root.querySelectorAll(".video-transcript__cue").forEach((c) => {
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

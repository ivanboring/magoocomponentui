/**
 * Live player — play/pause and mute toggles against a real <video> when present;
 * otherwise the controls toggle visual state for preview. No scrubber: live streams play
 * at the live edge.
 */
export default function init(root, props) {
  const video = root.querySelector(".video-player-live__video");
  const play = root.querySelector(".video-player-live__play");
  const iconPlay = root.querySelector(".video-player-live__icon-play");
  const iconPause = root.querySelector(".video-player-live__icon-pause");
  const mute = root.querySelector(".video-player-live__mute");
  if (!play) return () => {};
  const syncId = root.dataset.syncId || "";

  function setPlaying(p) {
    play.setAttribute("aria-pressed", String(p));
    play.setAttribute("aria-label", p ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", p);
    iconPause?.classList.toggle("hidden", !p);
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:state", { detail: { id: syncId, playing: p } }));
  }
  function onTime() {
    if (!syncId || !video || !video.duration) return;
    document.dispatchEvent(new CustomEvent("mediasync:time", {
      detail: { id: syncId, currentTime: video.currentTime, duration: video.duration, percent: (video.currentTime / video.duration) * 100 },
    }));
  }
  function onPlay() {
    if (video && video.src) { video.paused ? video.play() : video.pause(); }
    else setPlaying(play.getAttribute("aria-pressed") !== "true");
  }
  function onMute() {
    const next = mute.getAttribute("aria-pressed") !== "true";
    mute.setAttribute("aria-pressed", String(next));
    mute.setAttribute("aria-label", next ? "Unmute" : "Mute");
    if (video) video.muted = next;
  }

  play.addEventListener("click", onPlay);
  mute?.addEventListener("click", onMute);
  video?.addEventListener("play", () => setPlaying(true));
  video?.addEventListener("pause", () => setPlaying(false));
  video?.addEventListener("timeupdate", onTime);
  return () => {
    play.removeEventListener("click", onPlay);
    mute?.removeEventListener("click", onMute);
    video?.removeEventListener("timeupdate", onTime);
  };
}

/**
 * Video player — play/pause, mute, cycle playback speed, seek scrubber, fullscreen.
 * Works against a real <video> when present; otherwise the controls still toggle their
 * visual state so the skeleton is demonstrable without a media file.
 */
const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

export default function init(root, props) {
  const video = root.querySelector(".video-player__video");
  const play = root.querySelector(".video-player__play");
  const iconPlay = root.querySelector(".video-player__icon-play");
  const iconPause = root.querySelector(".video-player__icon-pause");
  const mute = root.querySelector(".video-player__mute");
  const speed = root.querySelector(".video-player__speed");
  const fs = root.querySelector(".video-player__fullscreen");
  const scrubber = root.querySelector(".video-player__scrubber");
  const progress = root.querySelector(".video-player__progress");
  if (!play || !scrubber || !progress) return () => {};
  const syncId = root.dataset.syncId || "";
  let speedIdx = 0;

  function setPlaying(playing) {
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute("aria-label", playing ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", playing);
    iconPause?.classList.toggle("hidden", !playing);
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:state", { detail: { id: syncId, playing } }));
  }
  // Move the visual scrubber/aria to a percent without touching the media element.
  function renderPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    progress.style.width = clamped + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }
  function onPlay() {
    if (video) { video.paused ? video.play() : video.pause(); }
    else setPlaying(play.getAttribute("aria-pressed") !== "true");
  }
  function onMute() {
    const next = mute.getAttribute("aria-pressed") !== "true";
    mute.setAttribute("aria-pressed", String(next));
    mute.setAttribute("aria-label", next ? "Unmute" : "Mute");
    if (video) video.muted = next;
  }
  function onSpeed() {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    const rate = SPEEDS[speedIdx];
    speed.textContent = rate + "×";
    if (video) video.playbackRate = rate;
  }
  const frame = root.querySelector(".video-player__frame") || root;
  function onFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else frame.requestFullscreen?.();
  }
  // Optional end-screen overlay (e.g. a watch-next-rail): shown when the video ends, hidden on
  // replay. Only meaningful when the end_screen slot actually has content.
  const endScreen = root.querySelector(".video-player__endscreen");
  const hasEndScreen = !!(endScreen && endScreen.querySelector("*"));
  function showEndScreen(show) {
    if (endScreen && hasEndScreen) endScreen.classList.toggle("hidden", !show);
  }
  function onTime() {
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    renderPct(pct);
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:time", {
      detail: { id: syncId, currentTime: video.currentTime, duration: video.duration, percent: pct },
    }));
  }
  // A satellite (scrubber/transcript/chapters) asked us to seek.
  function onSyncSeek(event) {
    const d = event.detail;
    if (!syncId || !d || d.id !== syncId) return;
    let pct = null;
    if (typeof d.percent === "number") pct = d.percent;
    else if (typeof d.seconds === "number" && video && video.duration) pct = (d.seconds / video.duration) * 100;
    if (video && video.duration) {
      if (typeof d.seconds === "number") video.currentTime = d.seconds;
      else if (typeof d.percent === "number") video.currentTime = (d.percent / 100) * video.duration;
    }
    if (pct != null) renderPct(pct);
  }
  // The player scrubbed itself — move media if present and tell satellites the new position.
  function broadcastTime(pct) {
    if (!syncId) return;
    const duration = video && video.duration ? video.duration : null;
    document.dispatchEvent(new CustomEvent("mediasync:time", {
      detail: { id: syncId, currentTime: duration ? (pct / 100) * duration : null, duration, percent: pct },
    }));
  }
  function seek(event) {
    const rect = scrubber.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    renderPct(pct);
    if (video && video.duration) video.currentTime = (pct / 100) * video.duration;
    broadcastTime(pct);
  }
  function onKey(event) {
    const now = Number(scrubber.getAttribute("aria-valuenow")) || 0;
    let v = null;
    if (event.key === "ArrowRight") v = Math.min(100, now + 5);
    else if (event.key === "ArrowLeft") v = Math.max(0, now - 5);
    if (v == null) return;
    renderPct(v);
    if (video && video.duration) video.currentTime = (v / 100) * video.duration;
    broadcastTime(v);
  }

  play.addEventListener("click", onPlay);
  mute?.addEventListener("click", onMute);
  speed?.addEventListener("click", onSpeed);
  fs?.addEventListener("click", onFullscreen);
  scrubber.addEventListener("click", seek);
  scrubber.addEventListener("keydown", onKey);
  video?.addEventListener("timeupdate", onTime);
  video?.addEventListener("play", () => { setPlaying(true); showEndScreen(false); });
  video?.addEventListener("pause", () => setPlaying(false));
  video?.addEventListener("ended", () => { setPlaying(false); showEndScreen(true); });
  video?.addEventListener("seeking", () => showEndScreen(false));
  if (syncId) document.addEventListener("mediasync:seek", onSyncSeek);
  return () => {
    play.removeEventListener("click", onPlay);
    mute?.removeEventListener("click", onMute);
    speed?.removeEventListener("click", onSpeed);
    fs?.removeEventListener("click", onFullscreen);
    scrubber.removeEventListener("click", seek);
    scrubber.removeEventListener("keydown", onKey);
    video?.removeEventListener("timeupdate", onTime);
    if (syncId) document.removeEventListener("mediasync:seek", onSyncSeek);
  };
}

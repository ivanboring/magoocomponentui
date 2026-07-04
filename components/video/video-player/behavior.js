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
  let speedIdx = 0;

  function setPlaying(playing) {
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute("aria-label", playing ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", playing);
    iconPause?.classList.toggle("hidden", !playing);
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
  function onFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.requestFullscreen?.();
  }
  function onTime() {
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    progress.style.width = pct + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(pct)));
  }
  function seek(event) {
    const rect = scrubber.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    progress.style.width = pct * 100 + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    if (video && video.duration) video.currentTime = pct * video.duration;
  }
  function onKey(event) {
    const now = Number(scrubber.getAttribute("aria-valuenow")) || 0;
    if (event.key === "ArrowRight") { const v = Math.min(100, now + 5); progress.style.width = v + "%"; scrubber.setAttribute("aria-valuenow", String(v)); }
    else if (event.key === "ArrowLeft") { const v = Math.max(0, now - 5); progress.style.width = v + "%"; scrubber.setAttribute("aria-valuenow", String(v)); }
  }

  play.addEventListener("click", onPlay);
  mute?.addEventListener("click", onMute);
  speed?.addEventListener("click", onSpeed);
  fs?.addEventListener("click", onFullscreen);
  scrubber.addEventListener("click", seek);
  scrubber.addEventListener("keydown", onKey);
  video?.addEventListener("timeupdate", onTime);
  video?.addEventListener("play", () => setPlaying(true));
  video?.addEventListener("pause", () => setPlaying(false));
  return () => {
    play.removeEventListener("click", onPlay);
    mute?.removeEventListener("click", onMute);
    speed?.removeEventListener("click", onSpeed);
    fs?.removeEventListener("click", onFullscreen);
    scrubber.removeEventListener("click", seek);
    scrubber.removeEventListener("keydown", onKey);
    video?.removeEventListener("timeupdate", onTime);
  };
}

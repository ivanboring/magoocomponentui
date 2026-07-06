/**
 * Audio player — play/pause toggle, a live "current / total" time readout, and a seek
 * scrubber against a real <audio> when a source is present; otherwise the controls still
 * toggle for preview.
 *
 * Props (via template): `scrubber` shows/hides the seek bar; `scrubber_usable` makes it
 * interactive (true) or a display-only progressbar (false); `download` shows a download link.
 * The behavior tolerates a hidden or non-interactive scrubber.
 */
function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function init(root, props) {
  const audio = root.querySelector(".audio-player__audio");
  const play = root.querySelector(".audio-player__play");
  const iconPlay = root.querySelector(".audio-player__icon-play");
  const iconPause = root.querySelector(".audio-player__icon-pause");
  const time = root.querySelector(".audio-player__time");
  const scrubber = root.querySelector(".audio-player__scrubber");
  const progress = root.querySelector(".audio-player__progress");
  if (!play) return () => {};
  const seekable = !!scrubber && scrubber.dataset.usable !== "false";

  function setPlaying(p) {
    play.setAttribute("aria-pressed", String(p));
    play.setAttribute("aria-label", p ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", p);
    iconPause?.classList.toggle("hidden", !p);
  }
  function renderProgress() {
    if (!audio || !audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progress) progress.style.width = pct + "%";
    scrubber?.setAttribute("aria-valuenow", String(Math.round(pct)));
    if (time) time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  }
  function onMeta() {
    // Show the real total the moment metadata is known, before the first play.
    if (audio && time && Number.isFinite(audio.duration)) time.textContent = `0:00 / ${formatTime(audio.duration)}`;
  }
  function onPlay() {
    if (audio && audio.src) { audio.paused ? audio.play() : audio.pause(); }
    else setPlaying(play.getAttribute("aria-pressed") !== "true");
  }
  function seek(event) {
    const rect = scrubber.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    if (progress) progress.style.width = pct * 100 + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    if (audio && audio.duration) audio.currentTime = pct * audio.duration;
  }
  function onKey(event) {
    const now = Number(scrubber.getAttribute("aria-valuenow")) || 0;
    let v = null;
    if (event.key === "ArrowRight") v = Math.min(100, now + 5);
    else if (event.key === "ArrowLeft") v = Math.max(0, now - 5);
    if (v == null) return;
    if (progress) progress.style.width = v + "%";
    scrubber.setAttribute("aria-valuenow", String(v));
    if (audio && audio.duration) audio.currentTime = (v / 100) * audio.duration;
  }

  play.addEventListener("click", onPlay);
  if (seekable) {
    scrubber.addEventListener("click", seek);
    scrubber.addEventListener("keydown", onKey);
  } else if (scrubber) {
    // Display-only: a progressbar, not a focusable seek control.
    scrubber.setAttribute("role", "progressbar");
    scrubber.setAttribute("aria-label", "Playback progress");
    scrubber.removeAttribute("tabindex");
  }
  audio?.addEventListener("timeupdate", renderProgress);
  audio?.addEventListener("loadedmetadata", onMeta);
  audio?.addEventListener("play", () => setPlaying(true));
  audio?.addEventListener("pause", () => setPlaying(false));
  return () => {
    play.removeEventListener("click", onPlay);
    if (seekable) {
      scrubber.removeEventListener("click", seek);
      scrubber.removeEventListener("keydown", onKey);
    }
    audio?.removeEventListener("timeupdate", renderProgress);
    audio?.removeEventListener("loadedmetadata", onMeta);
  };
}

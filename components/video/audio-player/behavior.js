/**
 * Audio player — play/pause toggle and a seek scrubber against a real <audio> when a
 * source is present; otherwise the controls still toggle for preview.
 */
export default function init(root, props) {
  const audio = root.querySelector(".audio-player__audio");
  const play = root.querySelector(".audio-player__play");
  const iconPlay = root.querySelector(".audio-player__icon-play");
  const iconPause = root.querySelector(".audio-player__icon-pause");
  const scrubber = root.querySelector(".audio-player__scrubber");
  const progress = root.querySelector(".audio-player__progress");
  if (!play || !scrubber || !progress) return () => {};

  function setPlaying(p) {
    play.setAttribute("aria-pressed", String(p));
    play.setAttribute("aria-label", p ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", p);
    iconPause?.classList.toggle("hidden", !p);
  }
  function onPlay() {
    if (audio && audio.src) { audio.paused ? audio.play() : audio.pause(); }
    else setPlaying(play.getAttribute("aria-pressed") !== "true");
  }
  function onTime() {
    if (!audio || !audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = pct + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(pct)));
  }
  function seek(event) {
    const rect = scrubber.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    progress.style.width = pct * 100 + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    if (audio && audio.duration) audio.currentTime = pct * audio.duration;
  }
  function onKey(event) {
    const now = Number(scrubber.getAttribute("aria-valuenow")) || 0;
    if (event.key === "ArrowRight") { const v = Math.min(100, now + 5); progress.style.width = v + "%"; scrubber.setAttribute("aria-valuenow", String(v)); }
    else if (event.key === "ArrowLeft") { const v = Math.max(0, now - 5); progress.style.width = v + "%"; scrubber.setAttribute("aria-valuenow", String(v)); }
  }

  play.addEventListener("click", onPlay);
  scrubber.addEventListener("click", seek);
  scrubber.addEventListener("keydown", onKey);
  audio?.addEventListener("timeupdate", onTime);
  audio?.addEventListener("play", () => setPlaying(true));
  audio?.addEventListener("pause", () => setPlaying(false));
  return () => {
    play.removeEventListener("click", onPlay);
    scrubber.removeEventListener("click", seek);
    scrubber.removeEventListener("keydown", onKey);
    audio?.removeEventListener("timeupdate", onTime);
  };
}

/**
 * Podcast card — inline audio player. Play/pause toggles the audio element and the
 * icon; the scrubber reflects and seeks playback position. Falls back gracefully with
 * no audio source (the UI still toggles state for preview purposes).
 */
export default function init(root, props) {
  const audio = root.querySelector(".card-podcast__audio");
  const play = root.querySelector(".card-podcast__play");
  const iconPlay = root.querySelector(".card-podcast__icon-play");
  const iconPause = root.querySelector(".card-podcast__icon-pause");
  const scrubber = root.querySelector(".card-podcast__scrubber");
  const progress = root.querySelector(".card-podcast__progress");
  if (!play || !scrubber || !progress) return () => {};

  function setPlaying(playing) {
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute("aria-label", playing ? "Pause episode" : "Play episode");
    iconPlay?.classList.toggle("hidden", playing);
    iconPause?.classList.toggle("hidden", !playing);
  }

  function onPlay() {
    if (audio && audio.src) {
      audio.paused ? audio.play() : audio.pause();
    } else {
      setPlaying(play.getAttribute("aria-pressed") !== "true");
    }
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
    if (event.key === "ArrowRight") { progress.style.width = Math.min(100, now + 5) + "%"; scrubber.setAttribute("aria-valuenow", String(Math.min(100, now + 5))); }
    else if (event.key === "ArrowLeft") { progress.style.width = Math.max(0, now - 5) + "%"; scrubber.setAttribute("aria-valuenow", String(Math.max(0, now - 5))); }
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

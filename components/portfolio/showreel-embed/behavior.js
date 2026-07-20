/**
 * Showreel embed - clicking the play button dispatches a "reel:play" event carrying the poster's
 * configured video URL, so the host can swap in a real player. The skeleton embeds no player.
 * Config comes from the data-video-url attribute (the portable init passes no props object).
 */
export default function init(root) {
  const button = root.querySelector(".showreel-embed__play");
  if (!button) return () => {};

  function onPlay() {
    root.dispatchEvent(new CustomEvent("reel:play", {
      bubbles: true,
      detail: { videoUrl: root.dataset.videoUrl || "" },
    }));
  }

  button.addEventListener("click", onPlay);
  return () => {
    button.removeEventListener("click", onPlay);
  };
}

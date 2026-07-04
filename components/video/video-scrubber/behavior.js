/**
 * Standalone video scrubber — click or Arrow keys move the played position and emit
 * scrubber:seek with the percentage. Buffered range is display-only.
 */
export default function init(root, props) {
  const track = root.querySelector(".video-scrubber__track");
  const played = root.querySelector(".video-scrubber__played");
  const thumb = root.querySelector(".video-scrubber__thumb");
  if (!track || !played) return () => {};

  function setPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    played.style.width = clamped + "%";
    if (thumb) thumb.style.left = clamped + "%";
    track.setAttribute("aria-valuenow", String(Math.round(clamped)));
    root.dispatchEvent(new CustomEvent("scrubber:seek", { bubbles: true, detail: { percent: clamped } }));
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
  track.addEventListener("click", onClick);
  track.addEventListener("keydown", onKey);
  return () => {
    track.removeEventListener("click", onClick);
    track.removeEventListener("keydown", onKey);
  };
}

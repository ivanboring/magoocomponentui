/**
 * Audio waveform — clicking (or Arrow keys) sets the played portion up to the cursor and
 * emits waveform:seek with the percentage.
 */
export default function init(root, props) {
  const track = root.querySelector(".audio-waveform__bars");
  if (!track) return () => {};
  const bars = () => Array.from(track.querySelectorAll(".audio-waveform__bar"));

  function setPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    const list = bars();
    const cut = (clamped / 100) * list.length;
    list.forEach((b, i) => { b.dataset.played = String(i < cut); });
    track.setAttribute("aria-valuenow", String(Math.round(clamped)));
    root.dispatchEvent(new CustomEvent("waveform:seek", { bubbles: true, detail: { percent: clamped } }));
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

/**
 * Video transcript — clicking a cue emits transcript:seek with its seconds and marks it
 * active. A player can listen and seek; the transcript can also be driven externally by
 * setting data-active on cues.
 */
export default function init(root, props) {
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
      root.dispatchEvent(new CustomEvent("transcript:seek", { bubbles: true, detail: { seconds: Number(cue.dataset.seconds) } }));
    }
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Now-playing bar — play/pause toggle swaps the icon state; emits nowplaying:toggle.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".now-playing-bar__toggle");
  const play = root.querySelector(".now-playing-bar__play");
  const pause = root.querySelector(".now-playing-bar__pause");
  if (!toggle) return () => {};
  function onClick() {
    const playing = root.dataset.playing !== "true";
    root.dataset.playing = String(playing);
    toggle.setAttribute("aria-pressed", String(playing));
    if (play) play.dataset.playing = String(playing);
    if (pause) pause.dataset.playing = String(playing);
    root.dispatchEvent(new CustomEvent("nowplaying:toggle", { bubbles: true, detail: { playing } }));
  }
  toggle.addEventListener("click", onClick);
  return () => toggle.removeEventListener("click", onClick);
}

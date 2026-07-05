/**
 * Mini player — toggles play/pause icon state; emits miniplayer:toggle.
 */
export default function init(root, props) {
  const toggle = root.querySelector(".mini-player__toggle");
  const play = root.querySelector(".mini-player__play");
  const pause = root.querySelector(".mini-player__pause");
  if (!toggle) return () => {};
  function onClick() {
    const playing = root.dataset.playing !== "true";
    root.dataset.playing = String(playing);
    toggle.setAttribute("aria-pressed", String(playing));
    if (play) play.dataset.playing = String(playing);
    if (pause) pause.dataset.playing = String(playing);
    root.dispatchEvent(new CustomEvent("miniplayer:toggle", { bubbles: true, detail: { playing } }));
  }
  toggle.addEventListener("click", onClick);
  return () => toggle.removeEventListener("click", onClick);
}

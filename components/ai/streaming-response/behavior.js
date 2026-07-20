/**
 * Streaming response behavior — the Stop button cancels the in-progress generation.
 * Clicking Stop dispatches a bubbling "stream:stop" CustomEvent a parent can listen for to abort
 * the request. The bouncing dots and blinking caret are pure CSS and need no JavaScript.
 */
export default function init(root) {
  const stopBtn = root.querySelector(".streaming-response__stop");
  if (!stopBtn) return () => {};

  function onStop() {
    root.dispatchEvent(new CustomEvent("stream:stop", { bubbles: true }));
  }

  stopBtn.addEventListener("click", onStop);
  return () => stopBtn.removeEventListener("click", onStop);
}

/**
 * Video lesson player — tab switching for the notes/transcript panels; emits lesson:tab.
 */
export default function init(root, props) {
  function onClick(event) {
    const tab = event.target.closest(".video-lesson-player__tab");
    if (!tab) return;
    root.querySelectorAll(".video-lesson-player__tab").forEach((t) => {
      const on = t === tab;
      t.dataset.active = String(on);
      t.setAttribute("aria-selected", String(on));
    });
    root.dispatchEvent(new CustomEvent("lesson:tab", { bubbles: true, detail: { tab: tab.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

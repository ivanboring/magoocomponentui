/**
 * Flashcard — flips between term and definition on click; emits flashcard:flip.
 */
export default function init(root, props) {
  function onClick() {
    const flipped = root.getAttribute("aria-pressed") !== "true";
    root.setAttribute("aria-pressed", String(flipped));
    root.dispatchEvent(new CustomEvent("flashcard:flip", { bubbles: true, detail: { flipped } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

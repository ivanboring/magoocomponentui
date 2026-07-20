/**
 * Coverage toggle row — flips an add-on on/off.
 * The switch state lives on data-state (styled via Tailwind data-attribute variants); this
 * behavior toggles it, keeps aria-checked in sync, and emits a "coverage:toggle" event carrying
 * the coverage name and new included state. Config comes from data-* (portable init, no props).
 */
export default function init(root) {
  const sw = root.querySelector(".coverage-toggle-row__switch");
  if (!sw) return () => {};

  function toggle() {
    const included = sw.dataset.state !== "true";
    sw.dataset.state = included ? "true" : "false";
    sw.setAttribute("aria-checked", included ? "true" : "false");
    root.dispatchEvent(
      new CustomEvent("coverage:toggle", {
        bubbles: true,
        detail: { name: root.dataset.name || "", included },
      }),
    );
  }

  sw.addEventListener("click", toggle);
  return () => sw.removeEventListener("click", toggle);
}

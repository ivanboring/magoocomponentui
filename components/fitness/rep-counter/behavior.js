/**
 * Rep counter — the +1 button increments, Reset zeroes.
 * Config comes from data-* attributes (portable init passes no props object): data-target, when set
 * and numeric, caps the count. The starting value is read from the rendered count text so the
 * server-rendered count prop is respected. Each change dispatches a bubbling rep:count event.
 */
export default function init(root) {
  const inc = root.querySelector(".rep-counter__inc");
  const reset = root.querySelector(".rep-counter__reset");
  const display = root.querySelector(".rep-counter__count");
  if (!inc || !display) return () => {};

  const target = parseInt(root.dataset.target, 10);
  const hasTarget = Number.isFinite(target);
  let count = parseInt(display.textContent, 10) || 0;

  function render() {
    display.textContent = String(count);
    root.dispatchEvent(new CustomEvent("rep:count", { bubbles: true, detail: { count } }));
  }
  function onInc() {
    if (hasTarget && count >= target) return;
    count += 1;
    render();
  }
  function onReset() {
    if (count === 0) return;
    count = 0;
    render();
  }

  inc.addEventListener("click", onInc);
  reset?.addEventListener("click", onReset);
  return () => {
    inc.removeEventListener("click", onInc);
    reset?.removeEventListener("click", onReset);
  };
}

/**
 * Two-factor setup — auto-advances the code cells and emits 2fa:complete when filled.
 */
export default function init(root, props) {
  const cells = Array.from(root.querySelectorAll(".two-factor-setup__cell"));
  if (!cells.length) return () => {};
  function onInput(event) {
    const i = cells.indexOf(event.target);
    event.target.value = event.target.value.replace(/\D/g, "").slice(-1);
    if (event.target.value && i < cells.length - 1) cells[i + 1].focus();
    const code = cells.map((c) => c.value).join("");
    if (code.length === cells.length) root.dispatchEvent(new CustomEvent("2fa:complete", { bubbles: true, detail: { code } }));
  }
  function onKeydown(event) {
    const i = cells.indexOf(event.target);
    if (event.key === "Backspace" && !event.target.value && i > 0) cells[i - 1].focus();
  }
  cells.forEach((c) => { c.addEventListener("input", onInput); c.addEventListener("keydown", onKeydown); });
  return () => cells.forEach((c) => { c.removeEventListener("input", onInput); c.removeEventListener("keydown", onKeydown); });
}

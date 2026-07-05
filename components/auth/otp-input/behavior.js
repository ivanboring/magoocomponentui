/**
 * OTP input — auto-advances to the next cell on entry, backspaces to the previous, and
 * distributes a pasted code across cells. Emits otp:complete when all cells are filled.
 */
export default function init(root, props) {
  const cells = Array.from(root.querySelectorAll(".otp-input__cell"));
  if (!cells.length) return () => {};
  function emitIfComplete() {
    const code = cells.map((c) => c.value).join("");
    if (code.length === cells.length && !cells.some((c) => c.value === "")) {
      root.dispatchEvent(new CustomEvent("otp:complete", { bubbles: true, detail: { code } }));
    }
  }
  function onInput(event) {
    const i = cells.indexOf(event.target);
    event.target.value = event.target.value.replace(/\D/g, "").slice(-1);
    if (event.target.value && i < cells.length - 1) cells[i + 1].focus();
    emitIfComplete();
  }
  function onKeydown(event) {
    const i = cells.indexOf(event.target);
    if (event.key === "Backspace" && !event.target.value && i > 0) cells[i - 1].focus();
  }
  function onPaste(event) {
    const text = (event.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    event.preventDefault();
    cells.forEach((c, i) => { c.value = text[i] || ""; });
    cells[Math.min(text.length, cells.length - 1)].focus();
    emitIfComplete();
  }
  cells.forEach((c) => {
    c.addEventListener("input", onInput);
    c.addEventListener("keydown", onKeydown);
    c.addEventListener("paste", onPaste);
  });
  return () => cells.forEach((c) => {
    c.removeEventListener("input", onInput);
    c.removeEventListener("keydown", onKeydown);
    c.removeEventListener("paste", onPaste);
  });
}

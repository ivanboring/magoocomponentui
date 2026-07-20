/**
 * Copy to clipboard — copies a value and briefly swaps to a "copied" state.
 *
 * On click the button writes data-value to the clipboard via navigator.clipboard.writeText, then
 * sets data-copied="true" for ~1.5s. That attribute drives the label/icon swap in pure CSS
 * (group-data-[copied=true]:* variants) — the check icon and copied label appear, the copy icon and
 * default label hide, with no bare `hidden` class toggled from JS. A bubbling "copy" event carries
 * the copied value. Config comes from data-* attributes; the portable init passes no props object.
 */
export default function init(root) {
  const btn = root.classList.contains("copy-to-clipboard__btn")
    ? root
    : root.querySelector(".copy-to-clipboard__btn");
  if (!btn) return () => {};

  let timer = 0;

  async function onClick() {
    const value = btn.dataset.value || "";
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      /* clipboard may be unavailable (insecure context / denied) — still show feedback */
    }
    btn.dataset.copied = "true";
    btn.dispatchEvent(new CustomEvent("copy", { bubbles: true, detail: { value } }));
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.dataset.copied = "false";
    }, 1500);
  }

  btn.addEventListener("click", onClick);

  return () => {
    btn.removeEventListener("click", onClick);
    clearTimeout(timer);
  };
}

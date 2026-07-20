/**
 * Referral invite - copy the referral code to the clipboard and flash a "Copied!" label.
 * Config comes from data-* attributes on the copy button (portable init passes no props object):
 *   - data-copy: the string to copy;
 *   - data-label-default / data-label-copied: the button labels to swap between.
 */
export default function init(root) {
  const button = root.querySelector(".referral-invite__copy");
  const label = root.querySelector(".referral-invite__copy-label");
  if (!button) return () => {};

  const text = button.dataset.copy || "";
  const idle = button.dataset.labelDefault || (label ? label.textContent : "Copy");
  const done = button.dataset.labelCopied || "Copied!";
  let timer = 0;

  async function copy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      if (label) label.textContent = done;
      root.dispatchEvent(new CustomEvent("referral:copied", { bubbles: true, detail: { code: text } }));
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (label) label.textContent = idle;
      }, 1600);
    } catch (err) {
      /* clipboard unavailable - leave the label unchanged */
    }
  }

  button.addEventListener("click", copy);
  return () => {
    button.removeEventListener("click", copy);
    clearTimeout(timer);
  };
}

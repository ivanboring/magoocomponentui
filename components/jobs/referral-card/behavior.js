/**
 * Referral card — copies the referral link to the clipboard and confirms briefly.
 */
export default function init(root, props) {
  const copy = root.querySelector(".referral-card__copy");
  if (!copy) return () => {};
  const original = copy.textContent;
  let timer;
  async function onClick() {
    const link = copy.dataset.copy || "";
    try { await navigator.clipboard?.writeText(link); } catch (_) { /* clipboard may be unavailable */ }
    copy.textContent = "Copied!";
    clearTimeout(timer);
    timer = setTimeout(() => { copy.textContent = original; }, 1500);
    root.dispatchEvent(new CustomEvent("referral:copy", { bubbles: true, detail: { link } }));
  }
  copy.addEventListener("click", onClick);
  return () => { copy.removeEventListener("click", onClick); clearTimeout(timer); };
}

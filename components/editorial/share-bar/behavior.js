/**
 * Share bar — the "link" network copies the current URL to the clipboard instead of
 * navigating, and briefly flags success via a share:copied event.
 */
export default function init(root, props) {
  function onClick(event) {
    const link = event.target.closest('[data-network="link"]');
    if (!link) return;
    event.preventDefault();
    const url = link.getAttribute("href") === "#" ? window.location.href : link.getAttribute("href");
    navigator.clipboard?.writeText(url).then(() => {
      root.dispatchEvent(new CustomEvent("share:copied", { bubbles: true, detail: { url } }));
    }).catch(() => {});
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

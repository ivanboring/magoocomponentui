/**
 * Share menu — a Share button toggles a popover of share targets plus a Copy link
 * action. Toggling flips the root's data-open (CSS reveals the panel via the
 * group-data-[open=true] variants) and syncs aria-expanded. Copy writes the shared
 * url to the clipboard and briefly swaps the copy label to "Copied!". Closes on
 * Escape and outside click. Cleanup clears the timer and removes every listener.
 */
export default function init(root) {
  const trigger = root.querySelector(".share-menu__trigger");
  const copyBtn = root.querySelector(".share-menu__copy");
  const copyLabel = root.querySelector(".share-menu__copy-label");
  if (!trigger) return () => {};

  const originalCopyText = copyLabel ? copyLabel.textContent : "";
  let copyTimer = 0;

  function setOpen(open) {
    root.dataset.open = open ? "true" : "false";
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function isOpen() {
    return root.dataset.open === "true";
  }
  function toggle() {
    setOpen(!isOpen());
  }
  function onCopy() {
    navigator.clipboard?.writeText(root.dataset.url || "");
    if (copyLabel) {
      copyLabel.textContent = "Copied!";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyLabel.textContent = originalCopyText;
      }, 1500);
    }
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  }
  function onOutside(event) {
    if (!root.contains(event.target)) setOpen(false);
  }

  trigger.addEventListener("click", toggle);
  copyBtn?.addEventListener("click", onCopy);
  root.addEventListener("keydown", onKey);
  document.addEventListener("click", onOutside);

  return () => {
    clearTimeout(copyTimer);
    trigger.removeEventListener("click", toggle);
    copyBtn?.removeEventListener("click", onCopy);
    root.removeEventListener("keydown", onKey);
    document.removeEventListener("click", onOutside);
  };
}

/**
 * Wallet connect - opens a wallet picker and reports the chosen wallet.
 * Open/closed state is driven by data-open on the root (revealed via the group-data-[open=true]
 * utilities in the template); this behavior only wires interaction (portable init passes no props):
 *   - the trigger toggles the picker;
 *   - clicking a wallet fires wallet:connect with { wallet } and closes;
 *   - Escape or an outside click closes.
 * When the root is server-rendered in the connected state there is no trigger, so init is a no-op.
 */
export default function init(root) {
  const trigger = root.querySelector(".wallet-connect__trigger");
  const menu = root.querySelector(".wallet-connect__menu");
  if (!trigger || !menu) return () => {};

  const isOpen = () => root.dataset.open === "true";
  function setOpen(open) {
    root.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
  }
  function open() {
    setOpen(true);
    menu.querySelector(".wallet-connect__wallet")?.focus();
  }
  function close() {
    setOpen(false);
  }
  function toggle() {
    isOpen() ? close() : open();
  }
  function onClick(event) {
    const wallet = event.target.closest(".wallet-connect__wallet");
    if (!wallet) return;
    root.dispatchEvent(new CustomEvent("wallet:connect", {
      bubbles: true,
      detail: { wallet: wallet.dataset.wallet },
    }));
    close();
    trigger.focus();
  }
  function onOutside(event) {
    if (!root.contains(event.target)) close();
  }
  function onKey(event) {
    if (event.key === "Escape" && isOpen()) {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener("click", toggle);
  menu.addEventListener("click", onClick);
  document.addEventListener("click", onOutside);
  root.addEventListener("keydown", onKey);
  return () => {
    trigger.removeEventListener("click", toggle);
    menu.removeEventListener("click", onClick);
    document.removeEventListener("click", onOutside);
    root.removeEventListener("keydown", onKey);
  };
}

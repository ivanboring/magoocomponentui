/**
 * Delete account — enables the destructive button only when the confirm word is typed
 * exactly. Emits account:delete on click.
 */
export default function init(root, props) {
  const input = root.querySelector(".delete-account__input");
  const cta = root.querySelector(".delete-account__cta");
  const word = root.dataset.confirm || "DELETE";
  if (!input || !cta) return () => {};
  function sync() { cta.disabled = input.value.trim() !== word; }
  function onClick() { if (!cta.disabled) root.dispatchEvent(new CustomEvent("account:delete", { bubbles: true })); }
  input.addEventListener("input", sync);
  cta.addEventListener("click", onClick);
  sync();
  return () => {
    input.removeEventListener("input", sync);
    cta.removeEventListener("click", onClick);
  };
}

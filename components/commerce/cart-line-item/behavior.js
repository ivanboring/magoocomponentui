/**
 * Cart line item — quantity stepper (clamped at 1) and remove. Emits cart-item:quantity
 * and cart-item:remove.
 */
export default function init(root, props) {
  const dec = root.querySelector(".cart-line-item__decrement");
  const inc = root.querySelector(".cart-line-item__increment");
  const qtyEl = root.querySelector(".cart-line-item__quantity");
  const remove = root.querySelector(".cart-line-item__remove");
  if (!qtyEl) return () => {};

  function setQty(q) {
    const next = Math.max(1, q);
    qtyEl.textContent = String(next);
    root.dataset.quantity = String(next);
    root.dispatchEvent(new CustomEvent("cart-item:quantity", { bubbles: true, detail: { quantity: next } }));
  }
  const onDec = () => setQty(Number(root.dataset.quantity) - 1);
  const onInc = () => setQty(Number(root.dataset.quantity) + 1);
  const onRemove = () => {
    root.dispatchEvent(new CustomEvent("cart-item:remove", { bubbles: true }));
    root.remove();
  };

  dec?.addEventListener("click", onDec);
  inc?.addEventListener("click", onInc);
  remove?.addEventListener("click", onRemove);
  return () => {
    dec?.removeEventListener("click", onDec);
    inc?.removeEventListener("click", onInc);
    remove?.removeEventListener("click", onRemove);
  };
}

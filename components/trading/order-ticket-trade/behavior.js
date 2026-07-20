/**
 * Order ticket — side toggle (buy/sell) + place-order dispatch.
 *
 * The buy/sell colouring is pure CSS off the root's data-state attribute
 * (group-data-[state=…]/tkt utilities in the template), so it renders in screenshots.
 * This behavior wires the interaction:
 *   - clicking a side button updates data-state (which restyles the toggle and the place button);
 *   - submitting the form dispatches an "order:submit" CustomEvent whose detail carries the
 *     symbol, side, order type, quantity and price for the host to act on.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const sides = Array.from(root.querySelectorAll(".order-ticket-trade__side"));
  const typeEl = root.querySelector(".order-ticket-trade__type");
  const qtyEl = root.querySelector(".order-ticket-trade__quantity");
  const priceEl = root.querySelector(".order-ticket-trade__price");

  const syncPressed = () => {
    const side = root.dataset.state;
    sides.forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === side ? "true" : "false"));
  };

  const onSide = (event) => {
    root.dataset.state = event.currentTarget.dataset.value;
    syncPressed();
  };
  sides.forEach((b) => b.addEventListener("click", onSide));

  const onSubmit = (event) => {
    event.preventDefault();
    root.dispatchEvent(
      new CustomEvent("order:submit", {
        bubbles: true,
        detail: {
          symbol: root.dataset.symbol || "",
          side: root.dataset.state || "",
          orderType: typeEl ? typeEl.value : root.dataset.orderType || "",
          quantity: qtyEl ? qtyEl.value : "",
          price: priceEl ? priceEl.value : "",
        },
      }),
    );
  };
  root.addEventListener("submit", onSubmit);

  syncPressed();

  return () => {
    sides.forEach((b) => b.removeEventListener("click", onSide));
    root.removeEventListener("submit", onSubmit);
  };
}

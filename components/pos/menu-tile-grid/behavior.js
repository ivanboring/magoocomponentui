/**
 * Menu tile grid — each tile dispatches a "menu:add" event when tapped.
 * The event bubbles and carries the item's name and price in its detail so the host can add it to
 * an order. Config comes from data-* attributes on the tiles (no props object is passed).
 */
export default function init(root) {
  const tiles = Array.from(root.querySelectorAll(".menu-tile-grid__tile"));

  const handlers = tiles.map((tile) => {
    const h = () => {
      root.dispatchEvent(new CustomEvent("menu:add", {
        bubbles: true,
        detail: { name: tile.dataset.name || "", price: tile.dataset.price || "" },
      }));
    };
    tile.addEventListener("click", h);
    return h;
  });

  return () => {
    tiles.forEach((tile, i) => tile.removeEventListener("click", handlers[i]));
  };
}

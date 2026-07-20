# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/cards/card-movie. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

No actionable suggestions were identified in this pass.

## Flexibility

The current prop surface (title, year, runtime, rating_display, genres, ...) can remain the simple default while supporting these opt-in extensions:

- Make collection behavior configurable: support empty and loading states, a visible-item or page-size limit, and an overflow strategy. Where consumers need richer rows or cards, accept an item-rendering slot instead of requiring one fixed item shape.
- Expose media aspect ratio, fit/position, responsive source, and fallback behavior. Keep alt text data-driven and allow the media region to be omitted or replaced when a consumer supplies custom artwork.


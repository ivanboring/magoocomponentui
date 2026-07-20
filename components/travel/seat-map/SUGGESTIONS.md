# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/travel/seat-map. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Make the component adapt cleanly to a 375 px viewport. Allow dense rows to wrap or stack, constrain fixed-width children, and reserve horizontal scrolling for data regions where it is genuinely useful.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (max_choices, rows) can remain the simple default while supporting these opt-in extensions:

- Make collection behavior configurable: support empty and loading states, a visible-item or page-size limit, and an overflow strategy. Where consumers need richer rows or cards, accept an item-rendering slot instead of requiring one fixed item shape.
- Let primary and secondary actions be optional and expose their labels, icons, disabled or loading state, and event handlers. A named action slot would let applications add domain-specific controls without forking the layout.


# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/dashboard/dashboard-shell. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Give every icon-only, image-only, or otherwise unnamed control a concise accessible name. Repeated controls should include enough context for assistive-technology users to distinguish them.
- Associate every form control with a visible label where possible, or an explicit accessible name when a visible label would be redundant. Placeholder text alone should not carry the field name.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (brand, nav, topbar, content) can remain the simple default while supporting these opt-in extensions:

- Make collection behavior configurable: support empty and loading states, a visible-item or page-size limit, and an overflow strategy. Where consumers need richer rows or cards, accept an item-rendering slot instead of requiring one fixed item shape.
- Let primary and secondary actions be optional and expose their labels, icons, disabled or loading state, and event handlers. A named action slot would let applications add domain-specific controls without forking the layout.


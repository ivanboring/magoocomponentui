# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/sports/venue-card. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Give every icon-only, image-only, or otherwise unnamed control a concise accessible name. Repeated controls should include enough context for assistive-technology users to distinguish them.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (name, city, capacity, image, href) can remain the simple default while supporting these opt-in extensions:

- Expose media aspect ratio, fit/position, responsive source, and fallback behavior. Keep alt text data-driven and allow the media region to be omitted or replaced when a consumer supplies custom artwork.
- Let primary and secondary actions be optional and expose their labels, icons, disabled or loading state, and event handlers. A named action slot would let applications add domain-specific controls without forking the layout.


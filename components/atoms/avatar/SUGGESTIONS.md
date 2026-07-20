# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/atoms/avatar. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

No actionable suggestions were identified in this pass.

## Flexibility

The current prop surface (name, initials, image, size, shape, ...) can remain the simple default while supporting these opt-in extensions:

- Expose media aspect ratio, fit/position, responsive source, and fallback behavior. Keep alt text data-driven and allow the media region to be omitted or replaced when a consumer supplies custom artwork.
- Keep the documented presets, but allow consumers to supply additional values and map each value to its label, icon, tone, or layout treatment. This keeps common cases simple without closing the component to domain-specific variants.


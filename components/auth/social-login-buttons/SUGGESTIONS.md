# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/auth/social-login-buttons. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Add a visible demo response for the primary action controls, such as a selected state, expanded content, toast, progress state, or validation message. In the live preview the controls accepted clicks without an observable change; if they are intentionally callback-only, document the emitted event and demonstrate it in the preview.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (providers, layout) can remain the simple default while supporting these opt-in extensions:

- Make collection behavior configurable: support empty and loading states, a visible-item or page-size limit, and an overflow strategy. Where consumers need richer rows or cards, accept an item-rendering slot instead of requiring one fixed item shape.
- Keep the documented presets, but allow consumers to supply additional values and map each value to its label, icon, tone, or layout treatment. This keeps common cases simple without closing the component to domain-specific variants.


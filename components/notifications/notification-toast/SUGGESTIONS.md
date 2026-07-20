# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/notifications/notification-toast. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Make the component adapt cleanly to a 375 px viewport. Allow dense rows to wrap or stack, constrain fixed-width children, and reserve horizontal scrolling for data regions where it is genuinely useful.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (variant, title, message, duration) can remain the simple default while supporting these opt-in extensions:

- Keep the documented presets, but allow consumers to supply additional values and map each value to its label, icon, tone, or layout treatment. This keeps common cases simple without closing the component to domain-specific variants.
- Let primary and secondary actions be optional and expose their labels, icons, disabled or loading state, and event handlers. A named action slot would let applications add domain-specific controls without forking the layout.


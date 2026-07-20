# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/onboarding/empty-inbox. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Add a visible demo response for the primary action controls, such as a selected state, expanded content, toast, progress state, or validation message. In the live preview the controls accepted clicks without an observable change; if they are intentionally callback-only, document the emitted event and demonstrate it in the preview.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (title, description, cta_label) can remain the simple default while supporting these opt-in extensions:

- Let primary and secondary actions be optional and expose their labels, icons, disabled or loading state, and event handlers. A named action slot would let applications add domain-specific controls without forking the layout.
- Define how long and localized text behaves: allow wrapping by default and offer an explicit line-clamp or truncation option with a way to reveal the full value.


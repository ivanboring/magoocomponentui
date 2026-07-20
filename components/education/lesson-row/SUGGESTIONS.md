# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/education/lesson-row. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

No actionable suggestions were identified in this pass.

## Flexibility

The current prop surface (number, title, duration, state) can remain the simple default while supporting these opt-in extensions:

- Keep the documented presets, but allow consumers to supply additional values and map each value to its label, icon, tone, or layout treatment. This keeps common cases simple without closing the component to domain-specific variants.
- Define how long and localized text behaves: allow wrapping by default and offer an explicit line-clamp or truncation option with a way to reveal the full value.


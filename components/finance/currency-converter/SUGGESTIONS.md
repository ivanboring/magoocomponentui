# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/finance/currency-converter. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Associate every form control with a visible label where possible, or an explicit accessible name when a visible label would be redundant. Placeholder text alone should not carry the field name.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (amount, from_code, to_code, rate, result) can remain the simple default while supporting these opt-in extensions:

- Support controlled field values plus per-field disabled, read-only, required, help, and error states. Allow consumers to choose stacked or inline field layout without replacing the component markup.
- Define how long and localized text behaves: allow wrapping by default and offer an explicit line-clamp or truncation option with a way to reveal the full value.


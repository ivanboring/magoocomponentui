# Suggestions

Reviewed on 2026-07-14 at https://ivanboring.github.io/magoocomponentui/c/jobs/application-form. The rendered component was opened in a browser at a 375 x 812 viewport; its available controls were hovered, focused, and safely clicked.

## Recommended improvements

- Give every icon-only, image-only, or otherwise unnamed control a concise accessible name. Repeated controls should include enough context for assistive-technology users to distinguish them.
- Associate every form control with a visible label where possible, or an explicit accessible name when a visible label would be redundant. Placeholder text alone should not carry the field name.

Re-test keyboard activation and focus visibility alongside the change.

## Flexibility

The current prop surface (title, fields, resume_file, cta_label) can remain the simple default while supporting these opt-in extensions:

- Make collection behavior configurable: support empty and loading states, a visible-item or page-size limit, and an overflow strategy. Where consumers need richer rows or cards, accept an item-rendering slot instead of requiring one fixed item shape.
- Support controlled field values plus per-field disabled, read-only, required, help, and error states. Allow consumers to choose stacked or inline field layout without replacing the component markup.


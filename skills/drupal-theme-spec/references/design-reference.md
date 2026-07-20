# Mapping a design reference onto the token contract

Token keys referenced below live in `skills/drupal-theme/base-theme/tokens.manifest.json`, grouped
as: brand, color, typography, shape, elevation, spacing, motion, layout, advanced.

## Refero style pages

`https://styles.refero.design/style/<id>` is server-rendered — fetch it and read:

- **Colors** — a neutral ramp plus one or two accents. Map:
  - the page background → `color_background` (and `color_surface` when the reference has no
    separate card color)
  - the darkest neutral → `color_on_background` / `color_on_surface`
  - a mid neutral → `color_on_surface_muted`
  - a light neutral → `color_surface_raised`, the next one up → `color_border`
  - **`color_primary` is the fill of the PRIMARY BUTTON / main call to action — not "the brand
    hue".** Do not assume the reference's most saturated colour is the button colour: look at what
    an actual primary button on the reference page is *filled with*. In many modern systems (Linear,
    Vercel, ElevenLabs, Stripe-ish minimal UIs) that fill is the **ink — black or near-black — on a
    white/eggshell background**, and the saturated brand hue appears only in links, highlights,
    focus rings and illustrations. In that case `color_primary` = the ink (`#000000`-ish),
    `color_primary_contrast` = white, and the brand hue belongs in **`color_accent`** (with
    `color_accent_contrast` for text on it). Only when the reference genuinely fills its main CTA
    with the brand hue does `color_primary` = that hue.
  - `color_ring` = the focus-ring colour, which is usually the **brand hue** (it must stay visible
    against a dark button), so it often equals `color_accent` rather than `color_primary`. Derive
    `shadow_focus` from `color_ring`.
  - a second accent, or the brand hue when the buttons are ink → `color_accent` +
    `color_accent_contrast`
- **Type** — the display family → `font_heading`, the text family → `font_body`, the code family →
  `font_mono`. Weights → `weight_heading` / `weight_body`. Tracking of the display size →
  `tracking_heading`.
- **Type scale** — take the body size as `text_base`; divide two adjacent steps to get the ratio and
  snap it to the nearest option in `scale_ratio` (1.125, 1.2, 1.25, 1.333, 1.414).
- **Radii** — the input radius → `radius_control`, the button radius → `radius_button` (a fully
  rounded button is `9999px` → `radius_pill`), the card radius → `radius_card`.
- **Shadows** — copy the card-level and raised-level presets verbatim into `shadow_card` /
  `shadow_raised`; derive `shadow_focus` as a 3px ring in the primary color. `shadow_rgb` is the tint
  (R, G, B) the base theme uses to derive all three shadows when left at default — set it from the
  reference's shadow color if you're not overriding the shadows individually.
- **Spacing** — a 4px base unit is the default (`density: 0.25rem`). An 8px-base system reads as
  Spacious (`0.3rem`); a 4px system with tight components reads as Compact (`0.2rem`). `space_section`,
  `space_card`, `space_control`, and `container_max_width` follow from how airy the reference feels.

## A live site

Open it with `agent-browser` and read computed styles from the real DOM — `getComputedStyle` on the
body (background, color, font-family), on a primary button (background, border-radius, color), on a
card (background, border, box-shadow, border-radius), on an h1 (font-family, weight, letter-spacing).
Cluster the colors you collect and map them the same way as above. Say plainly that this is inferred.

## A screenshot or image

Read the image directly and name what you see: the dominant background, one or two accent colors, the
type feel (serif/sans, weight, tight or loose tracking), whether corners read sharp or rounded, and
whether shadows are visible at all. This is the lowest-fidelity source — say so to the user, and
lean on step 2 (what the theme is for) plus reasonable defaults for anything you can't read off a
static image (exact hex values, precise radii, the type scale ratio).

## A description only

Use the `frontend-design` skill to compose a token set from the described mood rather than picking
values arbitrarily — it has the vocabulary for turning "warm, trustworthy, a little playful" into an
actual palette and type pairing.

## Contrast is not optional

After mapping, check every `*_contrast` pair against its background for WCAG AA (4.5:1 for body
text, 3:1 for large text). If the reference's own pairing fails, keep the reference's hue and adjust
the lightness until it passes, and tell the user you did.

## Dark mode

If the reference only shows a light scheme, derive the dark values rather than asking the user for 22
more colors: invert the neutral ramp (background ↔ darkest neutral), lift the accents' lightness so
they stay visible on a dark ground, and re-check contrast. Set `color_scheme` to `auto` unless the
user said otherwise.

## Show the mapping before writing it

Present the result as a table — `token key → value → where it came from` (e.g. "the reference's
button background, `#0447ff`") — and get a nod from the user before it goes into the answers JSON.
This is the step that turns "I like this design" into something the user can sanity-check instead of
a black box.

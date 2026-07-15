# Canvas media-entity props (image / video / rich-text)

**Date:** 2026-07-15
**Status:** Approved design, pending implementation plan.

## Problem

When Magoo components are wired into **Drupal Canvas** (the `canvas` module, formerly Experience
Builder) — as an SDC in `config: "canvas"` mode or as a Code Component — media props render as a
**free-text URL box**. Editors should instead get a **media-library picker** backed by real Drupal
**media entities**.

Today `emit/sdc.js` `propToSchema` deliberately emits image props as
`{ type: "string", format: "uri-reference" }` and the twig consumes a bare URL string. The comment
on `emit/sdc.js:72` explains why the Canvas `$ref` was dropped: it is **unresolvable when the Canvas
module is not installed**, and strict SDC then throws on the prop. The complication is that the SDC
file set is **shared** between plain-SDC and Canvas consumers (create-child's `config: "canvas"` mode
emits only the SDC and lets Canvas derive its own config), so the schema cannot unconditionally use
the `$ref`.

## Reference: Mercury conventions

From `git.drupalcode.org/project/mercury` (1.x), the Canvas-native shapes are:

- **image** (`hero-billboard`, `card-testimonial` `media`):
  ```yaml
  media:
    $ref: json-schema-definitions://canvas.module/image
    type: object
    title: Background image
    examples:
      - { src: assets/…jpg, alt: "…", width: 1920, height: 1344 }
  ```
- **video** (`video` component `media`): `$ref: json-schema-definitions://canvas.module/video`, `type: object`.
- **poster** (`video` component): an image — `$ref: json-schema-definitions://canvas.module/image`.
- **url / link** (`card-testimonial` `cite_url`): `type: string, format: uri-reference`. **Identical to
  what Magoo emits already** — no change.
- **enum** (`card-testimonial` `style`, `text` `text_size`): `type: string` + `enum` + `meta:enum`
  labels + `examples: [first]`. **Identical to Magoo already** — no change.
- **rich text** (`text` component `text`): `type: string, contentMediaType: text/html,
  x-formatting-context: block`. Magoo emits the first two but **not** `x-formatting-context: block`.

The value Canvas passes for an image/video `$ref` prop is an **object** (`{src, alt, width, height}`),
so the template must consume `media.src` / `media.alt`, not a bare string.

## Design

Introduce a single **`canvas` flag** that threads from create-child's `config: "canvas"` mode
(`scripts/theme-cli/create-child.mjs`) → `generate()` (`packages/generator/src/index.js`) → the SDC
and Code-Component emitters. Every other target and the plain-SDC path stay **byte-for-byte identical
to today** (verified by the existing generator snapshot/unit tests being unchanged for non-Canvas
output).

### 1. Schema — `emit/sdc.js` `propToSchema`

When `canvas` is true:

- **`image`** → `{ $ref: "json-schema-definitions://canvas.module/image", type: "object", title,
  description?, examples: [{ src, alt, width, height }] }`. The `examples[0]` is derived from the
  prop's authored example/default URL (as `src`) with sensible `alt`/`width`/`height` placeholders,
  so required props keep a valid Canvas default.
- **`video`** (new type, see §4) → `{ $ref: "json-schema-definitions://canvas.module/video",
  type: "object", title, description?, examples: [{ src, … }] }`.
- **`html`** → keep `{ type: "string", contentMediaType: "text/html" }` and **add
  `x-formatting-context: "block"`** (Canvas-only, so non-Canvas output is unchanged).

When `canvas` is false: unchanged — `image` and `video` emit
`{ type: "string", format: "uri-reference" }`; `html` omits `x-formatting-context`.

`link` and `enum` are **unchanged in both modes** (already match Mercury).

### 2. Twig — `emit/twig.js`

Thread the def's **prop-type map** and the `canvas` flag through `astToTwig` → `nodeToTwig` →
`partsToTwig`. In Canvas mode, when a bare interpolation (`p.kind === "expr"`) is exactly an
image/video-typed prop path:

- In a media-source attribute context — `src`, `poster`, `data-src` — rewrite `{{ image }}` →
  `{{ image.src }}`.
- In any other context (e.g. `style="background-image:url({{ image }})"`), also rewrite the bare
  path to `{{ image.src }}` (the media object is never itself a valid string).
- On an `<img>` / `<video>` element whose src/poster was rewritten and which has an **empty or absent
  `alt`**, inject `alt="{{ image.alt }}"` (accessibility — the media entity carries alt text).
- An explicitly authored sub-path (`{{ image.alt }}`, `{{ image.width }}`) passes through unchanged.

Non-Canvas twig is unchanged: `{{ image }}` stays a bare string interpolation.

### 3. Code Component — `emit/jsx.js` (`mode: "preact"`)

Code Components **always** run inside Canvas, so the Preact output always uses the object shape:
`<img src={image.src} alt={image.alt}>` for image/video-typed props. The React (`mode: "react"`) and
Vue targets — which exist to prove generality with no Drupal media layer — keep the **string** shape.

### 4. New `video` prop type — `def.js`

Add `"video"` to `PROP_TYPES`. Mapping per target:

- **Canvas SDC / Code Component** — media object via the `$ref` above.
- **Plain SDC / React / Vue / Storybook / HTML** — `uri-reference` string (matches how streaming
  components already pass a `data-src` URL).
- **Drupal paragraph/node/custom-field config** (`emit/drupal-config.js`) — out of scope for this
  change; a follow-up may map `video` to an appropriate field type. Image props in that path already
  have the `media_image` field type available (`drupal-config.js:120`).

`poster` needs no new type — it is authored as an ordinary `image` prop and inherits image handling.

### Threading points

- `packages/generator/src/index.js` `generate()` — accept and forward a `canvas` option to `emitSdc`;
  `emitJsx({ mode: "preact" })` always uses the object shape (no flag needed there).
- `packages/generator/src/emit/sdc.js` — `emitSdc` / `defToComponentYml` / `propToSchema` accept
  `canvas`.
- `packages/generator/src/emit/twig.js` — `astToTwig(ast, variants, { canvas, propTypes })`.
- `scripts/theme-cli/create-child.mjs` — pass `canvas: true` when a component's `mode === "canvas"`.
- The standalone `build <ids> --target sdc|code-component` and `config` commands: `code-component`
  always canvas; `sdc` gets `canvas` from a flag (default false to preserve current plain-SDC output).

## Testing

- **Generator unit tests** (`node --test`): assert non-Canvas SDC/twig output is unchanged for image
  props; add cases asserting the Canvas variant emits the `$ref` object schema, the `.src` twig
  rewrite, the auto `alt`, `x-formatting-context: block` on html, and the new `video` type both ways.
- **canvas-check**: confirm image/video `$ref` props don't regress Canvas eligibility
  (`packages/generator/src/canvas.js`) — object props are eligible (they have a concrete shape).
- **Full theme regen** (second user request): after implementation, generate a child theme via
  `create-child` including all catalog components in Canvas wiring mode; the ~251 Canvas-eligible
  components must show media-library pickers, non-eligible ones fall back to paragraph (with
  `media_image` fields). Verify a representative component renders in a real Drupal Canvas.

## Out of scope

- Mapping `video` to a Drupal field type in the paragraph/node/custom-field config path.
- Changing any component source or `examples/*.json` (the design requires none).
- `url`/`link` and `enum` schema — already correct.

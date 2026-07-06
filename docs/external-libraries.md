# External libraries

Almost every component in this catalog is **pure vanilla JS** with no runtime dependency —
that is the default and the strong preference (see the "Core Ideas" in `CLAUDE.md`). A small
number of components need a third-party library to do something the platform can't do alone
(e.g. play an adaptive stream). This page is the canonical list of those exceptions.

There is **no `dependencies` field in `metadata.yml`** — the metadata schema is
`additionalProperties: false` (`packages/schema/src/metadata.schema.js`), so a component's
external dependency is documented in prose (its `example_usage` / prop `description`) and
listed here.

## Components with an external dependency

| Component | Library | Version | Purpose | Load strategy |
|---|---|---|---|---|
| `video/video-player-live` | [hls.js](https://github.com/video-dev/hls.js/) | `@1` (latest 1.x, jsdelivr) | Play HLS (`.m3u8`) adaptive live streams in browsers without native HLS | Lazy dynamic `import()` from CDN, native-HLS first, only when a stream is present |
| `auth/two-factor-setup` | [qrcode](https://github.com/soldair/node-qrcode) | `@1` (latest 1.x, jsdelivr `+esm`) | Generate the authenticator QR as a real image from the `otpauth://` URI | Lazy dynamic `import()` from CDN, only when an `otpauth` URI is present; re-renders on update |

> To regenerate this table's coverage, grep the sources:
> `grep -rln 'jsdelivr\|unpkg\|esm.sh\|import(' components/*/*/behavior.js`

## Details

### `video-player-live` → hls.js

- **Why:** Chrome, Firefox, and Edge cannot play HLS (`.m3u8`) natively; hls.js implements
  HLS over Media Source Extensions. Safari/iOS *do* support HLS natively and are used directly.
- **How it loads** (`components/video/video-player-live/behavior.js`):
  1. The stream URL is authored on the `<video>` as **`data-src`** (not `src`) so a browser
     never tries to natively fetch an `.m3u8` it can't decode.
  2. On init, `setupStream()` inspects the URL:
     - not `.m3u8` → set as a plain progressive `src`;
     - native HLS available (`video.canPlayType("application/vnd.apple.mpegurl")`) → set `src`
       directly;
     - otherwise → `await import("https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.mjs")`
       (reusing a preloaded global `window.Hls` if present), then `new Hls()` +
       `loadSource()` + `attachMedia()`.
  3. The hls.js instance is destroyed in the behavior's returned cleanup function.
- **Lazy + conditional:** the import fires **only when an HLS stream is actually rendered**.
  A `video-player-live` with no `src` (or a non-HLS one) pulls nothing; no other component in
  the catalog loads hls.js.
- **CDN / version:** pinned to the `@1` major on jsdelivr (`dist/hls.mjs`, the ESM build).
  Bump deliberately — a floating major can pick up a new minor.
- **Graceful degradation:** if the CDN import fails (offline / blocked), the loader returns
  `null` and falls back to setting `video.src` directly (best effort); the poster and controls
  still render. The screenshot pipeline never runs `behavior.js`, so screenshots show the
  poster frame, not a stream.
- **Demo & Storybook:** the `examples/default.json` `src` is the public test stream
  `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`, so the Astro preview detail page and the
  Storybook "Default" story both exercise hls.js live.
- **Targets:** the loader is plain JS, so it ships verbatim to every target — SDC (portable
  self-init), Drupal Code Component, React, and Vue. The dynamic `import()` carries a
  `/* @vite-ignore */` comment so Storybook's Vite doesn't try to pre-bundle the CDN URL.

### `two-factor-setup` → qrcode

- **Why:** the authenticator QR must be a **real** scannable code generated from the account's
  `otpauth://totp/...` URI, not a decorative placeholder. qrcode renders it client-side.
- **How it loads** (`components/auth/two-factor-setup/behavior.js`): the `otpauth` URI is on the
  QR container as `data-otpauth`. On init (and whenever that attribute changes — a `MutationObserver`
  makes the image updatable), `renderQR()` `await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/qrcode@1/+esm")`
  (reusing `window.QRCode` if preloaded), then `QRCode.toDataURL(otpauth)` and sets the result as
  the `<img>` src. The manual secret shown below is parsed from the URI's `secret` param so the
  code and QR always match.
- **Lazy + conditional:** only imported when an `otpauth` URI is present; the `<img>` has no `src`
  until generated (avoids the empty-`src`→page-URL trap). Falls back to the empty placeholder box
  offline.
- **CDN / version:** jsdelivr `+esm` of `qrcode@1` (auto-bundled ESM). Screenshots don't run JS, so
  the QR image is absent in captured PNGs — the styled box shows instead.

## Adding a component that needs an external library

The pattern to follow (also captured as a gotcha in `CLAUDE.md`):

1. **Load it lazily from `behavior.js` itself** with a dynamic `import()` of the library's ESM
   CDN build — do **not** rely on a `<script>` tag (the targets don't emit one). Prefer a
   preloaded global and any native platform capability first, and only import when a prop
   actually requires the feature.
2. Add the `/* @vite-ignore */` comment inside the dynamic `import(...)` so Storybook's Vite
   leaves the absolute CDN URL alone.
3. Pin the CDN URL to a **major version** and use the library's `.mjs` / ESM entry point.
4. Keep any URL the browser must not fetch natively on a **`data-*` attribute**, not `src`,
   and attach it from behavior.
5. Document the dependency in the component's `example_usage` / prop `description`, and **add a
   row to the table above**.
6. Remember the emitters do **no AST transform** — `async`, `await`, dynamic `import()`, and
   module-level helpers pass through verbatim to all targets — and the screenshot pipeline does
   not run `behavior.js`, so a library/stream never loads during screenshot capture.

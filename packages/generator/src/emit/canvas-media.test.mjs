/**
 * Canvas media-entity props: image/video become a `canvas.module/*` $ref (a media-library picker)
 * for the Canvas SDC and the Code Component, while every other target keeps a plain URL string.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDef } from "../def.js";
import { parseTemplate } from "../parser.js";
import { generate } from "../index.js";

const def = normalizeDef({
  name: "hero-media",
  props: {
    heading: { type: "string", required: true },
    body: { type: "html" },
    image: { type: "image", required: true, example: "https://cdn.example/pic.jpg" },
    logo: { type: "image" },
    clip: { type: "video" },
  },
  slots: {},
});

const template = `<section>
  <h1>{{ heading }}</h1>
  <div>{{{ body }}}</div>
  <img src="{{ image }}" alt="">
  <img src="{{ logo }}" alt="Company logo">
  <video src="{{ clip }}" controls></video>
</section>`;

function gen(canvas) {
  return generate({ id: "marketing/hero-media", name: "hero-media", def, template, canvas }).files;
}

test("Canvas SDC: image/video props emit a media-entity $ref (object), not a URL string", () => {
  const yml = gen(true)["sdc/hero-media/hero-media.component.yml"];
  assert.match(yml, /image:\n\s+\$ref: json-schema-definitions:\/\/canvas\.module\/image\n\s+type: object/);
  assert.match(yml, /clip:\n\s+\$ref: json-schema-definitions:\/\/canvas\.module\/video/);
  // A required media prop's example becomes the media object shape (Canvas uses it as the default).
  assert.match(yml, /src: https:\/\/cdn\.example\/pic\.jpg/);
  assert.doesNotMatch(yml, /format: uri-reference/); // no URL-string image props remain
});

test("Canvas SDC: html prop gains x-formatting-context: block", () => {
  assert.match(gen(true)["sdc/hero-media/hero-media.component.yml"], /body:\n\s+type: string\n\s+contentMediaType: text\/html\n\s+x-formatting-context: block/);
});

test("Canvas twig: bare media prop resolves to .src, and empty alt is filled from the media alt", () => {
  const twig = gen(true)["sdc/hero-media/hero-media.twig"];
  assert.match(twig, /<img src="\{\{ image\.src \}\}" alt="\{\{ image\.alt \}\}">/);
  assert.match(twig, /<video src="\{\{ clip\.src \}\}"/);
  // An authored non-empty alt is preserved, not overwritten by the media alt.
  assert.match(twig, /<img src="\{\{ logo\.src \}\}" alt="Company logo">/);
});

test("Non-Canvas SDC is unchanged: image/video are URL strings, twig is a bare interpolation", () => {
  const files = gen(false);
  const yml = files["sdc/hero-media/hero-media.component.yml"];
  assert.match(yml, /image:\n\s+type: string\n\s+format: uri-reference/);
  assert.match(yml, /clip:\n\s+type: string\n\s+format: uri-reference/);
  assert.doesNotMatch(yml, /json-schema-definitions/);
  assert.doesNotMatch(yml, /x-formatting-context/);
  const twig = files["sdc/hero-media/hero-media.twig"];
  assert.match(twig, /<img src="\{\{ image \}\}" alt="">/);
  assert.doesNotMatch(twig, /image\.src/);
});

test("Code Component (Preact) always uses the media object shape; React keeps the string", () => {
  const files = gen(false); // canvas flag does NOT gate the jsx targets
  const preact = files["code-component/hero-media.jsx"];
  assert.match(preact, /<img src=\{image\.src\} alt=\{image\.alt\}/);
  assert.match(preact, /<video src=\{clip\.src\}/);
  assert.match(preact, /<img src=\{logo\.src\} alt="Company logo"/);

  const react = files["react/hero-media.jsx"];
  assert.match(react, /<img src=\{image\} alt=""/);
  assert.doesNotMatch(react, /image\.src/);
});

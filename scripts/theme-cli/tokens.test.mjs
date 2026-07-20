import { test } from "node:test";
import assert from "node:assert/strict";
import { loadManifest, tokenList, defaultSettings, settingsFromTokens, settingsYaml, coerceTokenValue } from "./tokens.mjs";

test("manifest covers every contract token group", async () => {
  const m = await loadManifest();
  const groups = m.groups.map((g) => g.key);
  for (const g of ["brand", "color", "typography", "shape", "elevation", "spacing", "motion", "layout", "advanced"]) {
    assert.ok(groups.includes(g), `missing group ${g}`);
  }
});

test("every token has a key, a css var, a type and a default", async () => {
  const m = await loadManifest();
  for (const t of tokenList(m)) {
    assert.match(t.key, /^[a-z0-9_]+$/, `bad key ${t.key}`);
    assert.ok(t.type, `${t.key} has no type`);
    assert.ok("default" in t, `${t.key} has no default`);
    if (t.var) assert.match(t.var, /^--[a-z-]+$/, `bad var ${t.var}`);
  }
});

test("color tokens carry a dark counterpart", async () => {
  const m = await loadManifest();
  const colors = tokenList(m).filter((t) => t.type === "color");
  assert.ok(colors.length >= 20, `expected >=20 colors, got ${colors.length}`);
  for (const t of colors) assert.ok("dark" in t, `${t.key} has no dark default`);
});

test("defaultSettings prefixes every key with magoo_ and adds _dark for colors", async () => {
  const m = await loadManifest();
  const s = defaultSettings(m);
  assert.equal(s.magoo_color_primary, "#4f46e5");
  assert.ok("magoo_color_primary_dark" in s);
  assert.equal(s.magoo_font_heading, '"Inter", ui-sans-serif, system-ui, sans-serif');
});

test("settingsFromTokens overrides only the tokens given", async () => {
  const m = await loadManifest();
  const s = settingsFromTokens(m, { color_primary: "#0447ff", font_heading: '"Waldenburg", sans-serif' });
  assert.equal(s.magoo_color_primary, "#0447ff");
  assert.equal(s.magoo_font_heading, '"Waldenburg", sans-serif');
  assert.equal(s.magoo_color_success, "#16a34a"); // untouched default
});

test("checkbox tokens are real booleans, not strings (the schema declares them type: boolean)", async () => {
  const m = await loadManifest();
  const s = defaultSettings(m);
  for (const t of tokenList(m).filter((x) => x.type === "checkbox")) {
    assert.equal(typeof s[`magoo_${t.key}`], "boolean", `magoo_${t.key} must be a boolean`);
  }
  assert.equal(s.magoo_sticky_header, false); // manifest default "0"
});

test("coerceTokenValue normalizes every truthy/falsy spelling of a checkbox", () => {
  for (const v of [true, 1, "1", "true", "TRUE", "yes", "on"]) assert.equal(coerceTokenValue("checkbox", v), true, String(v));
  for (const v of [false, 0, "0", "false", "no", "off", ""]) assert.equal(coerceTokenValue("checkbox", v), false, String(v));
  assert.equal(coerceTokenValue("color", "#fff"), "#fff"); // non-checkbox stays a string
});

test("settingsFromTokens coerces a checkbox override to a boolean", async () => {
  const m = await loadManifest();
  assert.equal(settingsFromTokens(m, { sticky_header: "1" }).magoo_sticky_header, true);
  assert.equal(settingsFromTokens(m, { sticky_header: true }).magoo_sticky_header, true);
  assert.equal(settingsFromTokens(m, { sticky_header: "false" }).magoo_sticky_header, false);
  assert.equal(settingsFromTokens(m, { sticky_header: 0 }).magoo_sticky_header, false);
});

test("settingsYaml writes checkboxes as unquoted YAML booleans", async () => {
  const m = await loadManifest();
  const y = settingsYaml("acme_theme", settingsFromTokens(m, { sticky_header: "1" }));
  assert.match(y, /^magoo_sticky_header: true$/m);
});

test("settingsYaml emits a Drupal theme settings file", async () => {
  const m = await loadManifest();
  const y = settingsYaml("acme_theme", settingsFromTokens(m, { color_primary: "#0447ff" }));
  assert.match(y, /magoo_color_primary: '#0447ff'/);
  assert.doesNotMatch(y, /machine/); // no stray keys
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSpec, evalExpect, seekTarget, rollup, normText } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

test("normText collapses whitespace and case", () => {
  assert.equal(normText("  Stage 2 -\n  Six to Twelve  Months "), "stage 2 - six to twelve months");
});

test("the shipped video-lesson gate spec is valid", () => {
  const spec = JSON.parse(readFileSync(path.join(HERE, "gates", "video-lesson.gates.json"), "utf8"));
  assert.deepEqual(validateSpec(spec), []);
});

test("validateSpec catches structural problems", () => {
  const errors = validateSpec({
    gates: [
      { id: "a", steps: [{ do: "click" }], expect: [{ read: "video.currentTime", near: 5 }] },
      { id: "a", steps: [{ do: "warp" }], expect: [] },
      { steps: [], expect: [{ read: "activeMarker", equals: true }] },
    ],
  });
  assert.ok(errors.some((e) => e.includes("click needs an anchor")));
  assert.ok(errors.some((e) => e.includes("near needs a numeric tol")));
  assert.ok(errors.some((e) => e.includes('unknown step "warp"')));
  assert.ok(errors.some((e) => e.includes("duplicate id")));
  assert.ok(errors.some((e) => e.includes("missing id")));
  assert.ok(errors.some((e) => e.includes("activeMarker needs an anchor")));
});

test("validateSpec rejects malformed anchors", () => {
  const errors = validateSpec({
    gates: [
      {
        id: "a",
        steps: [{ do: "click", anchor: { text: [] } }],
        expect: [
          { read: "activeMarker", anchor: { selector: ".css-hook" }, equals: true },
          { read: "markedCount", anchors: [{ text: ["ok"] }, {}], equals: 1 },
        ],
      },
    ],
  });
  assert.equal(errors.filter((e) => e.includes("anchor needs text[]")).length, 3);
});

test("evalExpect near/tol", () => {
  assert.equal(evalExpect({ read: "video.currentTime", near: 118, tol: 2.5 }, 118.9).ok, true);
  assert.equal(evalExpect({ read: "video.currentTime", near: 118, tol: 2.5 }, 0).ok, false);
});

test("evalExpect equals and notEquals", () => {
  assert.equal(evalExpect({ read: "video.paused", equals: false }, false).ok, true);
  assert.equal(evalExpect({ read: "video.paused", equals: false }, true).ok, false);
  assert.equal(evalExpect({ read: "video.playbackRate", notEquals: 1 }, 1.25).ok, true);
  assert.equal(evalExpect({ read: "video.playbackRate", notEquals: 1 }, 1).ok, false);
});

test("evalExpect treats an unresolvable read as a gate failure, not a crash", () => {
  const r = evalExpect({ read: "activeMarker", anchor: { text: ["x"] }, equals: true }, null);
  assert.equal(r.ok, false);
  assert.match(r.detail, /not found/);
});

test("seekTarget resolves absolute and from-end targets", () => {
  assert.equal(seekTarget({ seconds: 125 }, 263), 125);
  assert.equal(seekTarget({ fromEnd: 0.4 }, 263), 262.6);
  assert.equal(seekTarget({ fromEnd: 0.4 }, null), null);
});

test("rollup maps verdicts to exit codes", () => {
  assert.equal(rollup([{ verdict: "pass" }, { verdict: "pass" }]).exit, 0);
  assert.equal(rollup([{ verdict: "pass" }, { verdict: "fail" }]).exit, 1);
  assert.equal(rollup([{ verdict: "fail" }, { verdict: "infra" }]).exit, 2);
});

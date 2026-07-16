/**
 * Pure helpers for the behavioral gate runner — spec validation, expectation
 * evaluation, and seek-target resolution. No DOM, no Playwright: everything here
 * is unit-testable with `node --test` (see run-gates.test.mjs).
 */

const STEP_KINDS = new Set(["click", "seek", "play", "pause", "wait"]);
const READ_KINDS = new Set([
  "video.currentTime",
  "video.paused",
  "video.playbackRate",
  "video.ended",
  "activeMarker",
  "markedCount",
  "visible",
]);

/** Collapse whitespace and lowercase, so text anchors survive markup reflows. */
export function normText(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** An anchor must name content: text fragments or an accessible name. */
function anchorProblem(anchor) {
  if (!anchor || typeof anchor !== "object") return "anchor must be an object";
  const hasText = Array.isArray(anchor.text) && anchor.text.length > 0 && anchor.text.every((t) => typeof t === "string" && t.trim());
  const hasLabel = typeof anchor.ariaLabel === "string" && anchor.ariaLabel.trim();
  if (!hasText && !hasLabel) return "anchor needs text[] (non-empty strings) or ariaLabel";
  return null;
}

/**
 * Validate a gate spec. Returns an array of human-readable problems; empty
 * array means the spec is runnable.
 */
export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") return ["spec is not an object"];
  if (!Array.isArray(spec.gates) || spec.gates.length === 0) errors.push("spec.gates must be a non-empty array");
  const seen = new Set();
  for (const [i, gate] of (spec.gates ?? []).entries()) {
    const where = `gates[${i}]${gate?.id ? ` (${gate.id})` : ""}`;
    if (!gate.id) errors.push(`${where}: missing id`);
    if (gate.id && seen.has(gate.id)) errors.push(`${where}: duplicate id`);
    seen.add(gate.id);
    if (!Array.isArray(gate.expect) || gate.expect.length === 0) errors.push(`${where}: missing expect[]`);
    for (const [j, step] of (gate.steps ?? []).entries()) {
      if (!STEP_KINDS.has(step.do)) errors.push(`${where}.steps[${j}]: unknown step "${step.do}"`);
      if (step.do === "click") {
        const problem = step.anchor ? anchorProblem(step.anchor) : "click needs an anchor";
        if (problem) errors.push(`${where}.steps[${j}]: ${problem}`);
      }
      if (step.do === "seek" && typeof step.seconds !== "number" && typeof step.fromEnd !== "number") {
        errors.push(`${where}.steps[${j}]: seek needs seconds or fromEnd`);
      }
    }
    for (const [j, exp] of (gate.expect ?? []).entries()) {
      if (!READ_KINDS.has(exp.read)) errors.push(`${where}.expect[${j}]: unknown read "${exp.read}"`);
      if (exp.near !== undefined && typeof exp.tol !== "number") errors.push(`${where}.expect[${j}]: near needs a numeric tol`);
      if (exp.near === undefined && exp.equals === undefined && exp.notEquals === undefined) {
        errors.push(`${where}.expect[${j}]: needs near/tol, equals, or notEquals`);
      }
      if (exp.read === "activeMarker" || exp.read === "visible") {
        const problem = exp.anchor ? anchorProblem(exp.anchor) : `${exp.read} needs an anchor`;
        if (problem) errors.push(`${where}.expect[${j}]: ${problem}`);
      }
      if (exp.read === "markedCount") {
        if (!Array.isArray(exp.anchors) || !exp.anchors.length) errors.push(`${where}.expect[${j}]: markedCount needs anchors[]`);
        else for (const a of exp.anchors) { const p = anchorProblem(a); if (p) errors.push(`${where}.expect[${j}]: ${p}`); }
      }
    }
  }
  return errors;
}

/**
 * Judge one expectation against the value read from the page.
 * `got` may be null when the read could not resolve (element/video absent) —
 * that is a FAIL, not an infra error: the gate spec encodes the task's
 * acceptance contract, so a missing control is a failed acceptance.
 * Returns { ok, detail }.
 */
export function evalExpect(exp, got) {
  if (got === null || got === undefined) {
    return { ok: false, detail: `${exp.read}: not found (no matching element/video)` };
  }
  if (exp.near !== undefined) {
    const ok = typeof got === "number" && Math.abs(got - exp.near) <= exp.tol;
    return { ok, detail: `${exp.read}=${typeof got === "number" ? got.toFixed(2) : got} expected ${exp.near}±${exp.tol}` };
  }
  if (exp.equals !== undefined) {
    return { ok: got === exp.equals, detail: `${exp.read}=${got} expected ${exp.equals}` };
  }
  return { ok: got !== exp.notEquals, detail: `${exp.read}=${got} expected not ${exp.notEquals}` };
}

/** Resolve a seek step to absolute seconds given the media duration. */
export function seekTarget(step, duration) {
  if (typeof step.seconds === "number") return step.seconds;
  if (typeof step.fromEnd === "number" && typeof duration === "number" && duration > 0) {
    return Math.max(0, duration - step.fromEnd);
  }
  return null;
}

/** Roll gate verdicts up to a scoreboard + process exit code (0 pass, 1 fail, 2 infra). */
export function rollup(gateResults) {
  const pass = gateResults.filter((g) => g.verdict === "pass").length;
  const fail = gateResults.filter((g) => g.verdict === "fail").length;
  const infra = gateResults.filter((g) => g.verdict === "infra").length;
  const exit = infra > 0 ? 2 : fail > 0 ? 1 : 0;
  return { pass, fail, infra, total: gateResults.length, exit };
}

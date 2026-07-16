#!/usr/bin/env node
/**
 * Behavioral gate runner — deterministic validation of an assembled page's
 * *behavior* (does clicking a chapter seek the video? does the transcript follow
 * playback?), the part of "is the component composition correct" that otherwise
 * needs a human.
 *
 * Gates are anchored on CONTENT (visible text, accessible names), never on class
 * names or DOM shape, so the same suite grades this library's example pages AND
 * any independent implementation of the same task — which makes it the grading
 * half of a library-vs-vanilla agent eval (see README.md in this folder).
 *
 * Usage:
 *   node scripts/eval/run-gates.mjs --gates scripts/eval/gates/video-lesson.gates.json \
 *     --url https://ivanboring.github.io/magoocomponentui/examples?example=video-lesson \
 *     [--out report.json] [--gate <id>] [--exec <chromium-binary>] [--headed]
 *
 * Exit codes: 0 all gates pass · 1 at least one gate fails · 2 infra failure
 * (page would not load, spec invalid, runner crash). A missing button/video is a
 * gate FAIL, not infra: the spec encodes the task's acceptance contract.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import { validateSpec, evalExpect, seekTarget, rollup } from "./lib.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => {
    if (!v.startsWith("--")) return acc;
    const next = arr[i + 1];
    return [...acc, [v.slice(2), next && !next.startsWith("--") ? next : true]];
  }, []),
);

if (!args.gates || !args.url || args.help) {
  console.error("Usage: run-gates.mjs --gates <spec.json> --url <page-url> [--out report.json] [--gate <id>] [--exec <chromium>] [--headed]");
  process.exit(2);
}

const spec = JSON.parse(readFileSync(args.gates, "utf8"));
const specErrors = validateSpec(spec);
if (specErrors.length) {
  console.error("Invalid gate spec:\n  " + specErrors.join("\n  "));
  process.exit(2);
}

const url = /^[a-z]+:\/\//.test(args.url) ? args.url : pathToFileURL(path.resolve(args.url)).href;
const gates = args.gate ? spec.gates.filter((g) => g.id === args.gate) : spec.gates;
if (!gates.length) {
  console.error(`No gate named "${args.gate}" in ${args.gates}`);
  process.exit(2);
}

/**
 * Injected into every page load. Resolves content anchors and performs reads.
 * An anchor is either { text: ["fragment", ...] } — the smallest visible element
 * whose textContent contains every fragment (case- and whitespace-insensitive) —
 * or { ariaLabel: "Play" } — the first visible element whose aria-label matches.
 * Clicks walk up from the match to the nearest clickable ancestor.
 */
const PAGE_HELPERS = `
window.__magooGates = (() => {
  const norm = (s) => String(s ?? "").replace(/\\s+/g, " ").trim().toLowerCase();
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  };
  const area = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height; };
  function resolve(anchor, opts = {}) {
    const all = [...document.querySelectorAll("body *")];
    let matches;
    if (anchor.ariaLabel) {
      const want = norm(anchor.ariaLabel);
      matches = all.filter((el) => norm(el.getAttribute("aria-label")) === want);
    } else {
      const frags = anchor.text.map(norm);
      matches = all.filter((el) => { const t = norm(el.textContent); return frags.every((f) => t.includes(f)); });
    }
    // Prefer the smallest VISIBLE match; with includeHidden, fall back to a hidden
    // one so a "visible" read can report false instead of "not found".
    const vis = matches.filter(visible).sort((a, b) => area(a) - area(b));
    if (vis.length) return vis[0];
    return opts.includeHidden ? matches.find((el) => !visible(el)) ?? null : null;
  }
  function clickable(el) {
    let cur = el;
    for (let i = 0; cur && i < 5; i++) {
      const cs = getComputedStyle(cur);
      if (["BUTTON", "A"].includes(cur.tagName) || cur.getAttribute("role") === "button"
          || cur.onclick || cs.cursor === "pointer") return cur;
      cur = cur.parentElement;
    }
    return el;
  }
  const MARK_ATTR = "data-magoo-gate-target";
  function markForClick(anchor) {
    const el = resolve(anchor);
    if (!el) return false;
    clickable(el).setAttribute(MARK_ATTR, "1");
    return true;
  }
  function unmark() {
    document.querySelectorAll("[" + MARK_ATTR + "]").forEach((el) => el.removeAttribute(MARK_ATTR));
  }
  function video() {
    const vids = [...document.querySelectorAll("video")].filter(visible);
    vids.sort((a, b) => area(b) - area(a));
    return vids[0] ?? document.querySelector("video") ?? null;
  }
  function isMarked(el) {
    let cur = el;
    for (let i = 0; cur && i < 4; i++) {
      if (cur.getAttribute("aria-current") === "true" || cur.getAttribute("aria-selected") === "true"
          || cur.dataset.active === "true" || /(^|\\s)(active|current)(\\s|$|--)/.test(cur.className)) return true;
      cur = cur.parentElement;
    }
    return false;
  }
  function read(exp) {
    if (exp.read.startsWith("video.")) {
      const v = video();
      return v ? v[exp.read.slice(6)] : null;
    }
    if (exp.read === "activeMarker") {
      const el = resolve(exp.anchor);
      return el ? isMarked(el) : null;
    }
    if (exp.read === "markedCount") {
      const els = exp.anchors.map((a) => resolve(a));
      if (els.some((el) => !el)) return null;
      return els.filter((el) => isMarked(el)).length;
    }
    if (exp.read === "visible") {
      const el = resolve(exp.anchor, { includeHidden: true });
      return el ? visible(el) : null;
    }
    return null;
  }
  function duration() {
    const v = video();
    return v && v.duration ? v.duration : null;
  }
  function setTime(seconds) {
    const v = video();
    if (v) v.currentTime = seconds;
  }
  function playPause(play) {
    const v = video();
    if (!v) return false;
    if (play) { v.muted = true; v.play().catch(() => {}); } else v.pause();
    return true;
  }
  return { markForClick, unmark, read, duration, setTime, playPause };
})();
`;

const MARK_SEL = "[data-magoo-gate-target]";

async function runGate(page, gate) {
  const checks = [];
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.goto(url, { waitUntil: "load", timeout: 45000 }));
    await page.waitForTimeout(spec.settleMs ?? 800);
    for (const step of gate.steps ?? []) {
      if (step.do === "wait") await page.waitForTimeout(step.ms ?? 400);
      else if (step.do === "click") {
        const found = await page.evaluate((a) => window.__magooGates.markForClick(a), step.anchor);
        if (!found) {
          checks.push({ ok: false, detail: `click target not found: ${JSON.stringify(step.anchor)}` });
          return { id: gate.id, desc: gate.desc, verdict: "fail", checks };
        }
        await page.click(MARK_SEL, { timeout: 5000 }).catch(() => page.evaluate((sel) => document.querySelector(sel)?.click(), MARK_SEL));
        await page.evaluate(() => window.__magooGates.unmark());
      } else if (step.do === "seek") {
        const duration = await page.evaluate(() => window.__magooGates.duration());
        const target = seekTarget(step, duration);
        if (target !== null) await page.evaluate((t) => window.__magooGates.setTime(t), target);
      } else if (step.do === "play" || step.do === "pause") {
        await page.evaluate((p) => window.__magooGates.playPause(p), step.do === "play");
      }
    }
    for (const exp of gate.expect) {
      const got = await page.evaluate((e) => window.__magooGates.read(e), exp);
      checks.push(evalExpect(exp, got));
    }
    return { id: gate.id, desc: gate.desc, verdict: checks.every((c) => c.ok) ? "pass" : "fail", checks };
  } catch (err) {
    return { id: gate.id, desc: gate.desc, verdict: "infra", checks, reason: String(err.message ?? err).slice(0, 300) };
  }
}

const browser = await chromium.launch({
  headless: !args.headed,
  ...(typeof args.exec === "string" ? { executablePath: args.exec } : {}),
});
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(PAGE_HELPERS);
  for (const gate of gates) {
    const result = await runGate(page, gate);
    results.push(result);
    const mark = { pass: "PASS", fail: "FAIL", infra: "INFRA" }[result.verdict];
    console.log(`${mark.padEnd(6)} ${result.id}`);
    for (const c of result.checks.filter((x) => !x.ok)) console.log(`         ${c.detail}`);
    if (result.reason) console.log(`         ${result.reason}`);
  }
} finally {
  await browser.close();
}

const board = rollup(results);
console.log(`\n${board.pass}/${board.total} gates pass` + (board.infra ? ` (${board.infra} infra)` : ""));
const report = { gatesFile: args.gates, url, example: spec.example, results, rollup: board };
if (typeof args.out === "string") {
  writeFileSync(args.out, JSON.stringify(report, null, 2));
  console.log(`report: ${args.out}`);
}
process.exit(board.exit);

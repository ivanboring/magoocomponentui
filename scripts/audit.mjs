#!/usr/bin/env node
/**
 * Component audit — turns the hand-asserted `wcag` / `seo_score` metadata into
 * VERIFIED signals:
 *
 *  - a11y: real axe-core run (WCAG 2.0/2.1 A & AA rules) against the rendered
 *    component. Note: automated rules cover a subset of WCAG; a clean run is
 *    necessary, not sufficient, for a conformance claim.
 *  - semantics: a component-appropriate heuristic (headings, landmarks, alt text,
 *    accessible names) — the honest alternative to a page-level Lighthouse SEO score,
 *    which isn't meaningful for a component in isolation.
 *
 * Writes dist/audit.json and prints a summary, flagging where the asserted metadata
 * disagrees with the measured result. Run after `pnpm build && pnpm preview:build`.
 */
import { chromium } from "playwright";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { renderToHtml, defaultArgs } from "../packages/generator/src/index.js";
import { findComponentDirs, ROOT, DIST_DIR } from "./lib/components.mjs";

const require = createRequire(import.meta.url);
const AXE_SRC = readFileSync(path.join(path.dirname(require.resolve("axe-core")), "axe.min.js"), "utf8");

function loadPreviewCss() {
  const dir = path.join(ROOT, "preview", "dist", "_astro");
  if (!existsSync(dir)) {
    console.error("Preview CSS not found. Run `pnpm build && pnpm preview:build` first.");
    process.exit(1);
  }
  return readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n");
}

function doc(css, html) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>
<style>#shot{padding:24px;background:var(--color-background)}</style></head>
<body data-theme="simple"><main id="shot">${html}</main></body></html>`;
}

async function main() {
  const dirs = await findComponentDirs();
  const css = loadPreviewCss();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  /** @type {Record<string, any>} */
  const report = {};
  const rows = [];

  for (const { id } of dirs) {
    const distDir = path.join(DIST_DIR, id);
    const ast = JSON.parse(readFileSync(path.join(distDir, "ast.json"), "utf8"));
    const meta = JSON.parse(readFileSync(path.join(distDir, "meta.json"), "utf8"));
    const previewPath = path.join(distDir, "preview.json");
    const base = existsSync(previewPath) ? JSON.parse(readFileSync(previewPath, "utf8")) : defaultArgs(meta.def);
    const html = renderToHtml(ast, { ...base, $variants: meta.def.variants });

    await page.setContent(doc(css, html), { waitUntil: "load" });
    await page.addScriptTag({ content: AXE_SRC });
    const axe = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await window.axe.run("#shot", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return {
        violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
        passes: r.passes.length,
        incomplete: r.incomplete.length,
      };
    });

    const semantics = await page.evaluate(() => {
      const root = document.getElementById("shot");
      const imgs = [...root.querySelectorAll("img")];
      const imgsMissingAlt = imgs.filter((i) => !i.hasAttribute("alt")).length;
      const interactives = [...root.querySelectorAll("a[href],button")];
      const missingName = interactives.filter((el) => {
        const name = (el.getAttribute("aria-label") || el.textContent || el.querySelector("img")?.getAttribute("alt") || "").trim();
        return !name;
      }).length;
      const headings = root.querySelectorAll("h1,h2,h3,h4,h5,h6").length;
      const landmarks = root.querySelectorAll("article,section,nav,header,footer,main,aside,[role]").length;
      let score = 100;
      const issues = [];
      if (imgsMissingAlt) { score -= 20; issues.push(`${imgsMissingAlt} image(s) missing alt`); }
      if (missingName) { score -= 25; issues.push(`${missingName} control(s) without an accessible name`); }
      if (!landmarks) { score -= 10; issues.push("no semantic/landmark element"); }
      return { score: Math.max(0, score), headings, landmarks, imgs: imgs.length, issues };
    });

    const assertedWcag = meta.metadata?.categorization?.wcag?.level || null;
    const assertedSeo = meta.metadata?.categorization?.seo_score ?? null;
    const measuredLevel = axe.violations.length === 0 ? "AA*" : "fail";
    const flags = [];
    if (assertedWcag && assertedWcag !== "A" && measuredLevel === "fail") flags.push(`asserts WCAG ${assertedWcag} but axe found ${axe.violations.length} violation(s)`);
    if (assertedSeo != null && Math.abs(assertedSeo - semantics.score) >= 25) flags.push(`asserts SEO ${assertedSeo}, measured semantics ${semantics.score}`);

    report[id] = { axe, semantics, asserted: { wcag: assertedWcag, seo_score: assertedSeo }, flags };
    rows.push({ id, violations: axe.violations.length, axePasses: axe.passes, semantics: semantics.score, flags: flags.length });
  }

  await browser.close();
  writeFileSync(path.join(DIST_DIR, "audit.json"), JSON.stringify(report, null, 2));

  console.log("\nComponent audit (axe WCAG 2.0/2.1 A+AA · semantics heuristic)\n");
  console.log("id".padEnd(28), "axe✗".padStart(6), "axe✓".padStart(6), "sem".padStart(5), " flags");
  for (const r of rows) {
    console.log(r.id.padEnd(28), String(r.violations).padStart(6), String(r.axePasses).padStart(6), String(r.semantics).padStart(5), r.flags ? "  ⚠ " + r.flags : "");
  }
  console.log("\n* axe automates a subset of WCAG; a clean run is necessary, not sufficient. See dist/audit.json.");
}

main().catch((err) => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Screenshot pipeline — captures each component at 4 themes × 4 breakpoints (16 PNGs).
 * Reuses the preview's compiled Tailwind CSS + the reference renderer, so no dev
 * server is needed. Run after `pnpm build && pnpm preview:build`.
 *
 * Writes to components/<id>/screenshots/<theme>-<bp>.png (committed source of truth)
 * and mirrors into preview/public/screenshots/<id>/ so the preview can display them.
 */
import { chromium } from "playwright";
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToHtml, defaultArgs } from "../packages/generator/src/index.js";
import { findComponentDirs, readComponentSource, ROOT } from "./lib/components.mjs";

const THEMES = ["simple", "futuristic", "classic", "smooth"];
// Widest → narrowest, matching the preview display order.
const BREAKPOINTS = { desktop: 1440, small: 1024, tablet: 768, mobile: 375 };

const FONTS =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700" +
  "&family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Spectral:wght@400;600" +
  "&family=Quicksand:wght@400;600&family=Nunito+Sans:wght@400;600" +
  "&family=JetBrains+Mono&family=IBM+Plex+Mono&family=DM+Mono&display=swap";

function loadPreviewCss() {
  const dir = path.join(ROOT, "preview", "dist", "_astro");
  if (!existsSync(dir)) {
    console.error("Preview CSS not found. Run `pnpm build && pnpm preview:build` first.");
    process.exit(1);
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

function doc(css, theme, html) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<style>html,body{margin:0}#shot{display:block;padding:28px;background:var(--color-background)}</style>
</head><body><div id="shot" data-theme="${theme}">${html}</div></body></html>`;
}

async function main() {
  const dirs = await findComponentDirs();
  if (!dirs.length) {
    console.log("No components to screenshot.");
    return;
  }
  const css = loadPreviewCss();
  const browser = await chromium.launch();
  let total = 0;

  for (const { id, dir } of dirs) {
    const { defYaml } = await readComponentSource(dir);
    const distDir = path.join(ROOT, "dist", id);
    const ast = JSON.parse(readFileSync(path.join(distDir, "ast.json"), "utf8"));
    const meta = JSON.parse(readFileSync(path.join(distDir, "meta.json"), "utf8"));
    const previewPath = path.join(distDir, "preview.json");
    const base = existsSync(previewPath) ? JSON.parse(readFileSync(previewPath, "utf8")) : defaultArgs(meta.def);
    const args = { ...base, $variants: meta.def.variants };
    const html = renderToHtml(ast, args);

    const outDirs = [
      path.join(dir, "screenshots"),
      path.join(ROOT, "preview", "public", "screenshots", id),
    ];
    for (const d of outDirs) {
      rmSync(d, { recursive: true, force: true });
      mkdirSync(d, { recursive: true });
    }

    const page = await browser.newPage();
    for (const theme of THEMES) {
      await page.setContent(doc(css, theme, html), { waitUntil: "load" });
      await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
      for (const [bp, width] of Object.entries(BREAKPOINTS)) {
        await page.setViewportSize({ width, height: 1200 });
        const el = await page.$("#shot");
        const buf = await el.screenshot();
        for (const d of outDirs) writeFileSync(path.join(d, `${theme}-${bp}.png`), buf);
        total++;
      }
    }
    await page.close();
    console.log(`  ${id}: 16 shots`);
  }

  await browser.close();
  console.log(`Captured ${total} screenshots (${dirs.length} component(s) × 4 themes × 4 breakpoints).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

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
import yaml from "js-yaml";
import { renderToHtml, defaultArgs, generate } from "../packages/generator/src/index.js";
import { loadDef } from "../packages/generator/src/def.js";
import { findComponentDirs, readComponentSource, ROOT } from "./lib/components.mjs";

/** Read examples/*.json into a { StoryName: args } map (Default-first), or null. */
function readExamplesSync(dir) {
  const exDir = path.join(dir, "examples");
  if (!existsSync(exDir)) return null;
  const files = readdirSync(exDir).filter((f) => f.endsWith(".json"));
  if (!files.length) return null;
  const out = {};
  for (const f of files) {
    const name = path.basename(f, ".json").replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
    out[name] = JSON.parse(readFileSync(path.join(exDir, f), "utf8"));
  }
  return out;
}

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

const MIME_BY_EXT = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

// The screenshot pipeline renders via page.setContent() with no HTTP server, so
// root-relative example image paths (served by the Astro/Storybook static dirs at
// runtime) can't load over the network. Inline them as data URIs just for this pass.
function inlineStockImages(value) {
  if (typeof value === "string" && value.startsWith("/stock/")) {
    const mime = MIME_BY_EXT[path.extname(value).toLowerCase()];
    // Only inline images — non-visual assets (e.g. audio .mp3) aren't rendered in a
    // screenshot, so leave their paths untouched rather than base64-embedding megabytes.
    if (!mime) return value;
    const file = path.join(ROOT, "preview", "public", value);
    if (!existsSync(file)) return value;
    return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
  }
  if (Array.isArray(value)) return value.map(inlineStockImages);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inlineStockImages(v)]));
  }
  return value;
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
  let dirs = await findComponentDirs();
  // Optional CLI filters: `pnpm screenshots <id-substr> [...]` captures only matching
  // components (e.g. `video/video-player-live`). No args → capture everything.
  const filters = process.argv.slice(2);
  if (filters.length) dirs = dirs.filter(({ id }) => filters.some((f) => id.includes(f)));
  if (!dirs.length) {
    console.log("No components to screenshot.");
    return;
  }
  const css = loadPreviewCss();
  const browser = await chromium.launch();
  let total = 0;

  for (const { id, dir } of dirs) {
    // Generate ast/meta from source rather than reading dist/, so a concurrent `pnpm build`
    // (which clears dist mid-run) can't race the screenshot pass.
    const src = await readComponentSource(dir);
    const def = loadDef(src.defYaml);
    const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
    const examples = readExamplesSync(dir);
    const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples });
    const ast = JSON.parse(files["ast.json"]);
    const meta = JSON.parse(files["meta.json"]);
    const base = examples ? (examples.Default || Object.values(examples)[0]) : defaultArgs(meta.def);
    const args = inlineStockImages({ ...base, $variants: meta.def.variants });
    const html = renderToHtml(ast, args);

    const outDirs = [
      path.join(dir, "screenshots"),
      path.join(ROOT, "preview", "public", "screenshots", id),
    ];
    for (const d of outDirs) {
      rmSync(d, { recursive: true, force: true });
      mkdirSync(d, { recursive: true });
    }

    for (const [bp, width] of Object.entries(BREAKPOINTS)) {
      // Lay the page out at the real breakpoint width, but downscale the raster to <=500px
      // wide (deviceScaleFactor < 1) so the committed PNGs stay small.
      const context = await browser.newContext({
        viewport: { width, height: 1200 },
        deviceScaleFactor: Math.min(1, 500 / width),
      });
      const page = await context.newPage();
      for (const theme of THEMES) {
        await page.setContent(doc(css, theme, html), { waitUntil: "load" });
        await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
        const el = await page.$("#shot");
        const buf = await el.screenshot();
        for (const d of outDirs) writeFileSync(path.join(d, `${theme}-${bp}.png`), buf);
        total++;
      }
      await page.close();
      await context.close();
    }
    console.log(`  ${id}: 16 shots`);
  }

  await browser.close();
  console.log(`Captured ${total} screenshots (${dirs.length} component(s) × 4 themes × 4 breakpoints).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

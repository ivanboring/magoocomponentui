#!/usr/bin/env node
/**
 * Mirror the committed per-component screenshots (components/<cat>/<name>/screenshots/,
 * the source of truth) into preview/public/screenshots/<cat>/<name>/ so the static
 * preview can serve them. `pnpm screenshots` already writes both locations when it runs
 * Playwright; this reproduces just the copy so CI (and a fresh clone) can populate the
 * preview mirror without regenerating images.
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { findComponentDirs, ROOT } from "./lib/components.mjs";

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  const dirs = await findComponentDirs();
  const outRoot = path.join(ROOT, "preview", "public", "screenshots");
  await rm(outRoot, { recursive: true, force: true });
  let count = 0;
  for (const { id, dir } of dirs) {
    const shots = path.join(dir, "screenshots");
    if (!(await exists(shots))) continue;
    // Deploy only the simple-desktop shot (the repo keeps all 16 for the agent/skill).
    const src = path.join(shots, "simple-desktop.png");
    if (!(await exists(src))) continue;
    const dest = path.join(outRoot, id);
    await mkdir(dest, { recursive: true });
    await cp(src, path.join(dest, "simple-desktop.png"));
    count++;
  }
  console.log(`Mirrored screenshots for ${count} component(s) → preview/public/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// scripts/theme-cli/install-base.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, stat, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { installBaseTheme } from "./install-base.mjs";

test("installBaseTheme copies the base theme into a themes dir", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "magoo-base-"));
  const out = await installBaseTheme(dir);
  assert.equal(out, path.join(dir, "magoo_agentic_base_theme"));
  for (const f of ["magoo_agentic_base_theme.info.yml", "theme-settings.php", "includes/tokens.php", "tokens.manifest.json", "css/src/contract.css"]) {
    await stat(path.join(out, f)); // throws if missing
  }
  const info = await readFile(path.join(out, "magoo_agentic_base_theme.info.yml"), "utf8");
  assert.match(info, /regions:/);
  assert.match(info, /settings:/);
});

test("installBaseTheme does not copy node_modules or a built css dir", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "magoo-base-"));
  const out = await installBaseTheme(dir);
  await assert.rejects(() => stat(path.join(out, "node_modules")));
});

// scripts/theme-cli/install-base.mjs
/** Copy the canonical base theme into a Drupal themes directory. */
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseFlags } from "./search.mjs";
import { BASE_THEME_DIR, BASE_MACHINE } from "./tokens.mjs";

const SKIP = new Set(["node_modules", ".git"]);

/**
 * @param {string} themesDir  e.g. web/themes/custom
 * @returns {Promise<string>} the installed theme directory
 */
export async function installBaseTheme(themesDir) {
  const dest = path.join(themesDir, BASE_MACHINE);
  await mkdir(themesDir, { recursive: true });
  await cp(BASE_THEME_DIR, dest, {
    recursive: true,
    filter: (src) => !SKIP.has(path.basename(src)),
  });
  return dest;
}

/** @param {string[]} argv */
export async function runInstallBase(argv) {
  const f = parseFlags(argv);
  if (!f.out) throw new Error("install-base: pass --out <web/themes/custom>");
  const dest = await installBaseTheme(f.out);
  process.stderr.write(
    `Base theme installed → ${dest}\n` +
    `Next: npm install && npm run build:css in that directory, then enable it (it is a base theme — subtheme it with create-child).\n`
  );
}

#!/usr/bin/env node
/** Magoo theme CLI — search/build/config/create-theme against the component catalog. */
import { runSearch } from "./theme-cli/search.mjs";
import { runBuild } from "./theme-cli/build.mjs";
import { runConfig } from "./theme-cli/config.mjs";
import { runCreateTheme } from "./theme-cli/create-theme.mjs";
import { runInstallBase } from "./theme-cli/install-base.mjs";
import { runCreateChild } from "./theme-cli/create-child.mjs";
import { runCanvasCheck } from "./theme-cli/canvas-check.mjs";

const [cmd, ...argv] = process.argv.slice(2);
const commands = {
  search: runSearch,
  build: runBuild,
  config: runConfig,
  "create-theme": runCreateTheme,
  "install-base": runInstallBase,
  "create-child": runCreateChild,
  "canvas-check": runCanvasCheck,
};
const USAGE = `Usage: theme-cli <command> [args]

  search       [--q <words>] [--category <c>] [--usage <u>] [--atomic <a>] [--json]
  build        <ids…> --target sdc|code-component|react|vue|html --out <dir>
  config       <ids…> --as paragraph|node|custom-field [--theme <machine>] --out <dir>
  canvas-check [<ids…>] [--json]
                 Is each component usable as a Drupal Canvas component? (no ids = whole catalog)
                 An array-of-object / bare-object prop has no Canvas field shape → not eligible;
                 wire those with config: "paragraph" instead.
  create-theme --answers <file.json> [--out <theme-dir>]
                 --out is the THEME directory itself (it is created/filled in place).
  install-base --out <themes-dir>
                 --out is the Drupal THEMES directory (e.g. web/themes/custom).
  create-child --answers <file.json> [--themes-dir <themes-dir>]
                 --themes-dir is the Drupal THEMES directory (e.g. web/themes/custom), NOT the
                 theme directory: the child lands in <themes-dir>/<machine_name>, and the base
                 theme is installed alongside it if missing. --out is an alias of --themes-dir.
`;

const fn = commands[cmd];
if (!fn) {
  process.stderr.write(USAGE);
  process.exit(cmd ? 1 : 0);
}
fn(argv).catch((err) => { process.stderr.write(String(err?.stack || err) + "\n"); process.exit(1); });

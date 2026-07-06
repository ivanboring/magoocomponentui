#!/usr/bin/env node
/** Magoo theme CLI — search/build/config/create-theme against the component catalog. */
import { runSearch } from "./theme-cli/search.mjs";
import { runBuild } from "./theme-cli/build.mjs";
import { runConfig } from "./theme-cli/config.mjs";
import { runCreateTheme } from "./theme-cli/create-theme.mjs";

const [cmd, ...argv] = process.argv.slice(2);
const commands = { search: runSearch, build: runBuild, config: runConfig, "create-theme": runCreateTheme };
const fn = commands[cmd];
if (!fn) {
  process.stderr.write("Usage: theme-cli <search|build|config|create-theme> [args]\n");
  process.exit(cmd ? 1 : 0);
}
fn(argv).catch((err) => { process.stderr.write(String(err?.stack || err) + "\n"); process.exit(1); });

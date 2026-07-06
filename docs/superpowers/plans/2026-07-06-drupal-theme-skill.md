# Drupal Theme Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `drupal-theme` skill + in-repo CLI + Drupal 11 theme skeleton that let an agent search the catalog, pull components in as SDC or Code Components, generate matching Drupal config, and scaffold a themed Drupal 11 site.

**Architecture:** A dependency-free bootstrap (`skills/drupal-theme/bin/magoo`) fetches/caches this repo to `/tmp` (1-day TTL), runs `npm install`, and delegates to an in-repo CLI (`scripts/theme-cli.mjs`) that reuses `packages/generator` + `packages/schema` via relative imports. Subcommands: `search`, `build`, `config`, `create-theme`. A skeleton template + `SKILL.md` drive the guided theme flow.

**Tech Stack:** Node ESM, `node:test`, `js-yaml`, `node-html-parser`, `ajv`, Tailwind v4 (`@tailwindcss/cli`), Drupal 11 (SDC, paragraphs, custom_field).

## Global Constraints

- **Drupal 11**: theme `core_version_requirement: ^11`; regions copied from Olivero by default.
- **CLI reuses the generator** via relative imports; runtime deps added to repo root `dependencies`: `js-yaml`, `node-html-parser`, `ajv`. No pnpm-workspace dependency for the CLI.
- **npm required** (skill checks up front); the cache install uses `npm`, not pnpm.
- **Add vs remove**: skill adds directly; NEVER auto-removes — it tells the user to remove manually and warns of pitfalls.
- **Drupal-first**: other targets (WordPress/Hugo) supported via `build --target html|react|vue`, but always advocate Drupal.
- **custom-field targeting**: `config … --as custom-field --entity <type> --bundle <bundle>`.
- Commit after each task. Never push. Trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Generator API (confirmed): `generate({id,name,def,template,behavior,metadata,examples}) => { files }` where `files` is a `{ relPath: contents }` map with keys like `sdc/<name>/<name>.component.yml`, `code-component/<name>.jsx`, `react/…`, `vue/…`, `drupal/config/…`, `drupal/custom_field.<id>.yml`. Helpers: `loadDef(defYaml)` (`packages/generator/src/def.js`), `readComponentSource(dir)` + `findComponentDirs()` (`scripts/lib/components.mjs`).

---

## Phase 1 — CLI `search` + `build`

### Task 1: CLI scaffold + `search`

**Files:**
- Modify: `package.json` (add deps + `bin`)
- Create: `scripts/theme-cli.mjs` (arg router)
- Create: `scripts/theme-cli/search.mjs`
- Test: `scripts/theme-cli/search.test.mjs`

**Interfaces:**
- Produces: `searchComponents(all, filters) => Array<{id,display_name,short_description}>` where `all` is `Array<{id, metadata}>` and `filters` is `{q?, category?, subcategory?, usage?, atomic?, lifecycle?}`. Exported from `search.mjs`.
- `runSearch(argv, {cwd}) => Promise<void>` prints results.

- [ ] **Step 1: Write the failing test**

Create `scripts/theme-cli/search.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { searchComponents } from "./search.mjs";

const all = [
  { id: "cards/card-pricing", metadata: { name: "Pricing Card", short_description: "A pricing plan card.", use_cases: ["pricing"], categorization: { category: "Cards", subcategory: "Commerce", usage_type: ["card"], atomic_type: "organism" }, lifecycle: "experimental" } },
  { id: "auth/login-form", metadata: { name: "Login Form", short_description: "A sign-in form.", use_cases: [], categorization: { category: "Auth", usage_type: ["form"], atomic_type: "molecule" }, lifecycle: "stable" } },
];

test("filters by free-text query across name/description/use_cases", () => {
  assert.deepEqual(searchComponents(all, { q: "pricing" }).map((r) => r.id), ["cards/card-pricing"]);
});
test("filters by category and usage", () => {
  assert.deepEqual(searchComponents(all, { category: "Auth" }).map((r) => r.id), ["auth/login-form"]);
  assert.deepEqual(searchComponents(all, { usage: "card" }).map((r) => r.id), ["cards/card-pricing"]);
});
test("no filters returns all", () => {
  assert.equal(searchComponents(all, {}).length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/theme-cli/search.test.mjs`
Expected: FAIL — `Cannot find module './search.mjs'`.

- [ ] **Step 3: Implement `search.mjs`**

Create `scripts/theme-cli/search.mjs`:

```js
import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { findComponentDirs } from "../lib/components.mjs";

/** Load every component's metadata: [{ id, dir, metadata }]. */
export async function loadAllMetadata() {
  const dirs = await findComponentDirs();
  const out = [];
  for (const { id, dir } of dirs) {
    try {
      const raw = await readFile(path.join(dir, "metadata.yml"), "utf8");
      out.push({ id, dir, metadata: yaml.load(raw) || {} });
    } catch { /* skip components without metadata */ }
  }
  return out;
}

/** @param {any[]} all @param {{q?,category?,subcategory?,usage?,atomic?,lifecycle?}} f */
export function searchComponents(all, f = {}) {
  const q = (f.q || "").trim().toLowerCase();
  return all
    .filter(({ metadata: m }) => {
      const c = m.categorization || {};
      if (f.category && c.category !== f.category) return false;
      if (f.subcategory && c.subcategory !== f.subcategory) return false;
      if (f.atomic && c.atomic_type !== f.atomic) return false;
      if (f.lifecycle && m.lifecycle !== f.lifecycle) return false;
      if (f.usage && !(c.usage_type || []).includes(f.usage)) return false;
      if (q) {
        const hay = [m.name, m.short_description, (m.use_cases || []).join(" "), (m.example_prompts || []).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map(({ id, metadata: m }) => ({ id, display_name: m.name || id, short_description: m.short_description || "" }));
}

export async function runSearch(argv) {
  const f = parseFlags(argv);
  const all = await loadAllMetadata();
  const results = searchComponents(all, f);
  if (f.json) { process.stdout.write(JSON.stringify(results, null, 2) + "\n"); return; }
  for (const r of results) process.stdout.write(`${r.id} — ${r.display_name} — ${r.short_description}\n`);
  process.stderr.write(`\n${results.length} match(es)\n`);
}

/** Minimal `--key value` / `--flag` parser used by all subcommands. */
export function parseFlags(argv) {
  const f = {}; const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) f[key] = true;
      else { f[key] = next; i++; }
    } else rest.push(a);
  }
  f._ = rest;
  return f;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/theme-cli/search.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the router + deps + bin**

Create `scripts/theme-cli.mjs`:

```js
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
  process.stderr.write(`Usage: theme-cli <search|build|config|create-theme> [args]\n`);
  process.exit(cmd ? 1 : 0);
}
fn(argv).catch((err) => { process.stderr.write(String(err?.stack || err) + "\n"); process.exit(1); });
```

In `package.json`, add to `dependencies` (create the block) and a `bin`:

```json
  "bin": { "magoo-theme": "scripts/theme-cli.mjs" },
  "dependencies": {
    "ajv": "^8.17.1",
    "js-yaml": "^4.1.0",
    "node-html-parser": "^6.1.13"
  },
```

(Stub the not-yet-written imports so the router loads: create empty `scripts/theme-cli/build.mjs`, `config.mjs`, `create-theme.mjs`, each `export async function run<X>(){ throw new Error("not implemented"); }` — they're filled in later tasks.)

- [ ] **Step 6: Smoke-test search end-to-end**

Run: `node scripts/theme-cli.mjs search --q pricing --category Cards`
Expected: a line containing `cards/card-pricing — Pricing Card — …` and `1 match(es)` on stderr.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/theme-cli.mjs scripts/theme-cli/
git commit -m "feat(theme-cli): scaffold CLI + search subcommand

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 2: `build` subcommand

**Files:**
- Modify: `scripts/theme-cli/build.mjs`
- Test: `scripts/theme-cli/build.test.mjs`

**Interfaces:**
- Consumes: generator `generate()`, `loadDef()`, `readComponentSource()`.
- Produces: `filesForTarget(files, target) => { relPath: contents }` (subset of generate output for a target); `runBuild(argv)`.
- Target → path-prefix map: `sdc → "sdc/"`, `code-component → "code-component/"`, `react → "react/"`, `vue → "vue/"`, `html` (special: renders `renderToHtml` of the default example to `<name>.html`).

- [ ] **Step 1: Write the failing test**

Create `scripts/theme-cli/build.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { filesForTarget } from "./build.mjs";

const files = {
  "sdc/card-x/card-x.component.yml": "a",
  "sdc/card-x/card-x.twig": "b",
  "code-component/card-x.jsx": "c",
  "react/card-x.jsx": "d",
  "drupal/config/paragraphs.paragraphs_type.card_x.yml": "e",
};

test("selects only the SDC files for target sdc", () => {
  assert.deepEqual(Object.keys(filesForTarget(files, "sdc")).sort(), ["sdc/card-x/card-x.component.yml", "sdc/card-x/card-x.twig"]);
});
test("selects the code-component file for target code-component", () => {
  assert.deepEqual(Object.keys(filesForTarget(files, "code-component")), ["code-component/card-x.jsx"]);
});
test("throws on unknown target", () => {
  assert.throws(() => filesForTarget(files, "svelte"), /unknown target/i);
});
```

- [ ] **Step 2: Run it — expect FAIL** (`filesForTarget` undefined).

Run: `node --test scripts/theme-cli/build.test.mjs`

- [ ] **Step 3: Implement `build.mjs`**

Replace `scripts/theme-cli/build.mjs`:

```js
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../../packages/generator/src/def.js";
import { generate, renderToHtml } from "../../packages/generator/src/index.js";
import { readComponentSource } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";

const PREFIX = { sdc: "sdc/", "code-component": "code-component/", react: "react/", vue: "vue/" };

/** @param {Record<string,string>} files @param {string} target */
export function filesForTarget(files, target) {
  if (target === "html") return files; // handled specially in runBuild
  const prefix = PREFIX[target];
  if (!prefix) throw new Error(`unknown target: ${target}`);
  return Object.fromEntries(Object.entries(files).filter(([k]) => k.startsWith(prefix)));
}

export async function runBuild(argv) {
  const f = parseFlags(argv);
  const ids = f._;
  const target = f.target || "sdc";
  const out = f.out || "./out";
  if (!ids.length) throw new Error("build: pass one or more component ids");

  for (const id of ids) {
    const dir = path.join("components", id);
    const src = await readComponentSource(dir);
    const def = loadDef(src.defYaml);
    const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
    const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null });

    if (target === "html") {
      const ast = JSON.parse(files["ast.json"]);
      const meta = JSON.parse(files["meta.json"]);
      const html = renderToHtml(ast, { ...defaultExample(dir), $variants: meta.def.variants });
      const dest = path.join(out, `${def.name}.html`);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, html);
      continue;
    }
    for (const [rel, contents] of Object.entries(filesForTarget(files, target))) {
      const dest = path.join(out, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
  }
  process.stderr.write(`Built ${ids.length} component(s) → ${out} (target: ${target})\n`);
}

function defaultExampleSync(dir) { return {}; }
async function defaultExample(dir) {
  try { return JSON.parse(await readFile(path.join(dir, "examples/default.json"), "utf8")); } catch { return {}; }
}
```

(Note: fix `html` branch to `await defaultExample(dir)`; the sync stub above is a leftover — delete `defaultExampleSync` and `await` the async one.)

- [ ] **Step 4: Run the test — expect PASS.**

Run: `node --test scripts/theme-cli/build.test.mjs`

- [ ] **Step 5: Smoke-test SDC build**

Run: `node scripts/theme-cli.mjs build cards/card-pricing --target sdc --out /tmp/tbuild && ls /tmp/tbuild/sdc/card-pricing`
Expected: `card-pricing.component.yml  card-pricing.twig` (and `.js` if the component has behavior). Verify the `.component.yml` parses: `node -e "require('js-yaml').load(require('fs').readFileSync('/tmp/tbuild/sdc/card-pricing/card-pricing.component.yml','utf8'))"` exits 0.

- [ ] **Step 6: Commit**

```bash
git add scripts/theme-cli/build.mjs scripts/theme-cli/build.test.mjs
git commit -m "feat(theme-cli): build subcommand (sdc/code-component/react/vue/html)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — CLI `config`

### Task 3: `config --as paragraph`

**Files:**
- Modify: `scripts/theme-cli/config.mjs`
- Test: `scripts/theme-cli/config.test.mjs`

**Interfaces:**
- Produces: `paragraphConfigFiles(files) => { relPath: contents }` — the `drupal/config/*` + `drupal/paragraph--*.twig` subset. `runConfig(argv)`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { paragraphConfigFiles } from "./config.mjs";

const files = {
  "drupal/config/paragraphs.paragraphs_type.card_x.yml": "a",
  "drupal/config/field.storage.paragraph.field_price.yml": "b",
  "drupal/paragraph--card-x.html.twig": "c",
  "drupal/custom_field.card-x.yml": "note",
  "sdc/card-x/card-x.twig": "z",
};
test("paragraph config selects drupal config + twig, not custom_field note or sdc", () => {
  assert.deepEqual(Object.keys(paragraphConfigFiles(files)).sort(), [
    "drupal/config/field.storage.paragraph.field_price.yml",
    "drupal/config/paragraphs.paragraphs_type.card_x.yml",
    "drupal/paragraph--card-x.html.twig",
  ]);
});
```

- [ ] **Step 2: Run — expect FAIL.** `node --test scripts/theme-cli/config.test.mjs`

- [ ] **Step 3: Implement `paragraphConfigFiles` + `runConfig` (paragraph branch)**

```js
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadDef } from "../../packages/generator/src/def.js";
import { generate } from "../../packages/generator/src/index.js";
import { readComponentSource } from "../lib/components.mjs";
import { parseFlags } from "./search.mjs";
import { customFieldConfigFiles } from "./config-custom-field.mjs";

export function paragraphConfigFiles(files) {
  return Object.fromEntries(Object.entries(files).filter(([k]) =>
    k.startsWith("drupal/config/") || (k.startsWith("drupal/paragraph--") && k.endsWith(".html.twig"))));
}

export async function runConfig(argv) {
  const f = parseFlags(argv);
  const ids = f._;
  const as = f.as || "paragraph";
  const out = f.out || "./out";
  if (!ids.length) throw new Error("config: pass one or more component ids");
  if (as === "custom-field" && (!f.entity || !f.bundle)) throw new Error("config --as custom-field requires --entity and --bundle");

  for (const id of ids) {
    const dir = path.join("components", id);
    const src = await readComponentSource(dir);
    const def = loadDef(src.defYaml);
    const metadata = src.metadataYaml ? yaml.load(src.metadataYaml) : {};
    const { files } = generate({ id, name: def.name, def, template: src.template, behavior: src.behavior, metadata, examples: null });

    const emit = as === "custom-field"
      ? customFieldConfigFiles(def, { entity: f.entity, bundle: f.bundle })
      : paragraphConfigFiles(files);
    for (const [rel, contents] of Object.entries(emit)) {
      const dest = path.join(out, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, contents);
    }
  }
  process.stderr.write(`Wrote config for ${ids.length} component(s) → ${out} (as: ${as})\n`);
}
```

- [ ] **Step 4: Run — expect PASS.** `node --test scripts/theme-cli/config.test.mjs`

- [ ] **Step 5: Smoke-test** `node scripts/theme-cli.mjs config cards/card-pricing --as paragraph --out /tmp/tcfg && ls /tmp/tcfg/drupal/config | head`
Expected: paragraph + field config yml files.

- [ ] **Step 6: Commit** (`config.mjs` + test; stub `config-custom-field.mjs` with `export function customFieldConfigFiles(){throw new Error("not implemented")}` so the import resolves).

```bash
git add scripts/theme-cli/config.mjs scripts/theme-cli/config.test.mjs scripts/theme-cli/config-custom-field.mjs
git commit -m "feat(theme-cli): config --as paragraph

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 4: `config --as custom-field --entity --bundle`

**Files:**
- Modify: `scripts/theme-cli/config-custom-field.mjs`
- Test: `scripts/theme-cli/config-custom-field.test.mjs`

**Interfaces:**
- Produces: `customFieldConfigFiles(def, { entity, bundle }) => { relPath: contents }` — emits a `field.storage.<entity>.field_<machine>.yml` (type `custom_field`, one column per scalar prop) and `field.field.<entity>.<bundle>.field_<machine>.yml`.
- `columnTypeFor(propType) => "string"|"integer"|"boolean"|"uri"`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import yaml from "js-yaml";
import { customFieldConfigFiles, columnTypeFor } from "./config-custom-field.mjs";

const def = { name: "card-x", props: [
  { name: "title", type: "string" }, { name: "count", type: "integer" },
  { name: "featured", type: "boolean" }, { name: "href", type: "link" },
]};

test("maps prop types to custom_field column types", () => {
  assert.equal(columnTypeFor("string"), "string");
  assert.equal(columnTypeFor("integer"), "integer");
  assert.equal(columnTypeFor("boolean"), "boolean");
  assert.equal(columnTypeFor("link"), "uri");
});

test("emits storage + field bound to the entity/bundle with a column per scalar prop", () => {
  const out = customFieldConfigFiles(def, { entity: "node", bundle: "article" });
  const storageKey = "drupal/config/field.storage.node.field_card_x.yml";
  const fieldKey = "drupal/config/field.field.node.article.field_card_x.yml";
  assert.ok(out[storageKey], "storage file present");
  assert.ok(out[fieldKey], "field file present");
  const storage = yaml.load(out[storageKey]);
  assert.equal(storage.type, "custom_field");
  assert.equal(storage.entity_type, "node");
  assert.deepEqual(Object.keys(storage.settings.columns).sort(), ["count", "featured", "href", "title"]);
  const field = yaml.load(out[fieldKey]);
  assert.equal(field.entity_type, "node");
  assert.equal(field.bundle, "article");
});
```

- [ ] **Step 2: Run — expect FAIL.** `node --test scripts/theme-cli/config-custom-field.test.mjs`

- [ ] **Step 3: Implement `config-custom-field.mjs`**

```js
import yaml from "js-yaml";

const COL = { string: "string", text: "string", html: "string", link: "uri", image: "uri", integer: "integer", boolean: "boolean", enum: "string" };
/** @param {string} t */
export function columnTypeFor(t) { return COL[t] || "string"; }

const machine = (name) => String(name).replace(/-/g, "_");

/** Build a single custom_field attaching the component's scalar props to entity.bundle. */
export function customFieldConfigFiles(def, { entity, bundle }) {
  const fieldMachine = `field_${machine(def.name)}`;
  const columns = {};
  for (const p of def.props) {
    if (p.type === "array" || p.type === "object") continue; // complex → separate custom_field; out of scope here
    columns[p.name] = { name: p.name, type: columnTypeFor(p.type) };
  }
  const storage = {
    langcode: "en", status: true, dependencies: { module: ["custom_field"] },
    id: `${entity}.${fieldMachine}`, field_name: fieldMachine, entity_type: entity,
    type: "custom_field", settings: { columns, field_settings: {} }, module: "custom_field",
    locked: false, cardinality: 1, translatable: true, indexes: {}, persist_with_no_fields: false, custom_storage: false,
  };
  const field = {
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.${entity}.${fieldMachine}`], module: ["custom_field"] },
    id: `${entity}.${bundle}.${fieldMachine}`, field_name: fieldMachine, entity_type: entity, bundle,
    label: def.name, description: "", required: false, translatable: false, default_value: [], default_value_callback: "",
    settings: { columns: {}, field_settings: {} }, field_type: "custom_field",
  };
  return {
    [`drupal/config/field.storage.${entity}.${fieldMachine}.yml`]: yaml.dump(storage),
    [`drupal/config/field.field.${entity}.${bundle}.${fieldMachine}.yml`]: yaml.dump(field),
  };
}
```

- [ ] **Step 4: Run — expect PASS.** `node --test scripts/theme-cli/config-custom-field.test.mjs`

- [ ] **Step 5: Smoke-test** `node scripts/theme-cli.mjs config cards/card-pricing --as custom-field --entity node --bundle article --out /tmp/tcf && ls /tmp/tcf/drupal/config`
Expected: `field.storage.node.field_card_pricing.yml` and `field.field.node.article.field_card_pricing.yml`; both parse as YAML.

- [ ] **Step 6: Commit**

```bash
git add scripts/theme-cli/config-custom-field.mjs scripts/theme-cli/config-custom-field.test.mjs
git commit -m "feat(theme-cli): config --as custom-field bound to entity/bundle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Skill bootstrap (fetch/cache + npm gate)

### Task 5: `skills/drupal-theme/bin/magoo`

**Files:**
- Create: `skills/drupal-theme/bin/magoo` (executable, dependency-free)
- Create: `skills/drupal-theme/bin/cache.mjs` (the TTL helper, unit-testable)
- Test: `skills/drupal-theme/bin/cache.test.mjs`

**Interfaces:**
- Produces: `isStale(mtimeMs, nowMs, ttlMs=86400000) => boolean`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale } from "./cache.mjs";

test("cache older than 1 day is stale", () => {
  const now = 1_000_000_000_000;
  assert.equal(isStale(now - 86_400_001, now), true);
  assert.equal(isStale(now - 1000, now), false);
});
```

- [ ] **Step 2: Run — expect FAIL.** `node --test skills/drupal-theme/bin/cache.test.mjs`

- [ ] **Step 3: Implement `cache.mjs`**

```js
export const DAY_MS = 86_400_000;
/** @param {number} mtimeMs @param {number} nowMs @param {number} [ttlMs] */
export function isStale(mtimeMs, nowMs, ttlMs = DAY_MS) { return nowMs - mtimeMs > ttlMs; }
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Implement the bootstrap `bin/magoo`**

Create `skills/drupal-theme/bin/magoo` (`chmod +x`):

```js
#!/usr/bin/env node
/** Dependency-free bootstrap: ensure repo cache (1-day TTL) + npm install, then delegate. */
import { existsSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { isStale } from "./cache.mjs";

const REPO = "https://github.com/ivanboring/magoocomponentui";
const CACHE = path.join(os.tmpdir(), "magoo-component-ui");
const MARK = path.join(CACHE, ".npm-installed");

function sh(cmd, args, opts = {}) { execFileSync(cmd, args, { stdio: "inherit", ...opts }); }

function ensureCache() {
  if (existsSync(CACHE) && isStale(statSync(CACHE).mtimeMs, Date.now())) rmSync(CACHE, { recursive: true, force: true });
  if (!existsSync(CACHE)) {
    try { sh("git", ["clone", "--depth", "1", REPO, CACHE]); }
    catch { throw new Error("Failed to clone the component repo. Ensure git + network access."); }
  }
  if (!existsSync(MARK)) {
    sh("npm", ["install", "--no-audit", "--no-fund"], { cwd: CACHE });
    execFileSync("node", ["-e", `require('fs').writeFileSync(${JSON.stringify(MARK)}, '')`]);
  }
}

// Preflight: node + npm present.
for (const bin of ["npm"]) {
  try { execFileSync(bin, ["--version"], { stdio: "ignore" }); }
  catch { process.stderr.write(`Required tool not found: ${bin}. Install Node.js/npm first.\n`); process.exit(1); }
}
ensureCache();
sh("node", [path.join(CACHE, "scripts", "theme-cli.mjs"), ...process.argv.slice(2)]);
```

- [ ] **Step 6: Verify preflight + delegation shape (no network in CI: dry-run the parts that don't clone)**

Run: `node skills/drupal-theme/bin/magoo` with `CACHE` already pointing at the repo — for the smoke test, temporarily set `const CACHE = process.env.MAGOO_CACHE || path.join(...)` and run `MAGOO_CACHE="$PWD" node skills/drupal-theme/bin/magoo search --q pricing`.
Expected: prints the search result (delegates to the local repo's CLI). Then revert to the tmpdir default. Document `MAGOO_CACHE` as a test override in a comment.

- [ ] **Step 7: Commit**

```bash
git add skills/drupal-theme/bin/
git commit -m "feat(drupal-theme): bootstrap — fetch/cache repo (1-day TTL) + npm + delegate

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Theme skeleton + `create-theme`

### Task 6: Skeleton template

**Files:**
- Create: `skills/drupal-theme/skeleton/__MACHINE__.info.yml`
- Create: `skills/drupal-theme/skeleton/__MACHINE__.libraries.yml`
- Create: `skills/drupal-theme/skeleton/css/src/styles.css`
- Create: `skills/drupal-theme/skeleton/package.json`
- Create: `skills/drupal-theme/skeleton/templates/page.html.twig`
- Create: `skills/drupal-theme/skeleton/olivero-regions.yml` (the default region set)

- [ ] **Step 1: Author the skeleton files** (verbatim contents)

`__MACHINE__.info.yml`:
```yaml
name: __NAME__
type: theme
base theme: false
core_version_requirement: ^11
description: __DESCRIPTION__
libraries:
  - __MACHINE__/global
# regions injected from olivero-regions.yml by create-theme
```

`olivero-regions.yml` (Olivero's regions):
```yaml
regions:
  header: Header
  primary_menu: 'Primary menu'
  secondary_menu: 'Secondary menu'
  breadcrumb: Breadcrumb
  highlighted: Highlighted
  hero: Hero
  content_above: 'Content above'
  content: Content
  content_below: 'Content below'
  sidebar: Sidebar
  footer_top: 'Footer top'
  footer_bottom: 'Footer bottom'
```

`__MACHINE__.libraries.yml`:
```yaml
global:
  css:
    theme:
      css/dist/styles.css: {}
```

`css/src/styles.css`:
```css
@import "tailwindcss";
/* Token contract — values substituted by create-theme from the design-system answers. */
@theme {
  --color-primary: __COLOR_PRIMARY__;
  --color-primary-contrast: __COLOR_PRIMARY_CONTRAST__;
  --color-background: __COLOR_BACKGROUND__;
  --color-surface: __COLOR_SURFACE__;
  --color-on-surface: __COLOR_ON_SURFACE__;
  --font-heading: __FONT_HEADING__;
  --font-body: __FONT_BODY__;
  --radius-card: __RADIUS_CARD__;
}
/* Scan the theme's SDC templates for utilities. */
@source "./components/**/*.{twig,js}";
```

`package.json`:
```json
{
  "name": "__MACHINE__",
  "private": true,
  "scripts": {
    "build:css": "npx @tailwindcss/cli -i ./css/src/styles.css -o ./css/dist/styles.css --minify",
    "watch": "npx @tailwindcss/cli -i ./css/src/styles.css -o ./css/dist/styles.css --watch",
    "dev": "npx @tailwindcss/cli -i ./css/src/styles.css -o ./css/dist/styles.css"
  },
  "devDependencies": { "@tailwindcss/cli": "^4.0.0", "tailwindcss": "^4.0.0" }
}
```

`templates/page.html.twig`:
```twig
{# Minimal page template — renders each region. Replace/extend as needed. #}
<div class="page bg-background text-on-surface font-body">
  {% for region in ['header', 'hero', 'content', 'sidebar', 'footer_top', 'footer_bottom'] %}
    {% if page[region] %}<div class="region region-{{ region }}">{{ page[region] }}</div>{% endif %}
  {% endfor %}
</div>
```

- [ ] **Step 2: Commit** (no test — pure template assets; validated by Task 7)

```bash
git add skills/drupal-theme/skeleton/
git commit -m "feat(drupal-theme): Drupal 11 theme skeleton (Olivero regions, Tailwind v4)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task 7: `create-theme`

**Files:**
- Modify: `scripts/theme-cli/create-theme.mjs`
- Test: `scripts/theme-cli/create-theme.test.mjs`

**Interfaces:**
- Produces: `substitute(text, vars) => string` (replaces `__KEY__` tokens); `runCreateTheme(argv)` reads an answers JSON, copies the skeleton, substitutes placeholders + machine name in file names, injects regions, and runs `build`/`config` for each requested component.
- Answers JSON shape: `{ machine_name, name, description, colors:{primary,primary_contrast,background,surface,on_surface}, fonts:{heading,body}, radius:{card}, regions:"olivero"|<path>, components:[{id, config:"paragraph"|"custom-field", entity?, bundle?}], target:"sdc"|"code-component" }`.

- [ ] **Step 1: Write the failing test**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { substitute } from "./create-theme.mjs";

test("substitute replaces __KEY__ tokens and leaves others", () => {
  const out = substitute("name: __NAME__ / __MACHINE__ / __UNKNOWN__", { NAME: "Acme", MACHINE: "acme" });
  assert.equal(out, "name: Acme / acme / __UNKNOWN__");
});
```

- [ ] **Step 2: Run — expect FAIL.** `node --test scripts/theme-cli/create-theme.test.mjs`

- [ ] **Step 3: Implement `create-theme.mjs`**

```js
import { readFile, mkdir, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { parseFlags } from "./search.mjs";
import { runBuild } from "./build.mjs";
import { runConfig } from "./config.mjs";

const SKELETON = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../skills/drupal-theme/skeleton");

/** @param {string} text @param {Record<string,string>} vars */
export function substitute(text, vars) {
  return text.replace(/__([A-Z_]+)__/g, (m, k) => (k in vars ? vars[k] : m));
}

async function copyTree(from, to, vars) {
  for (const e of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, e.name);
    const name = e.name.replace(/__MACHINE__/g, vars.MACHINE);
    const dest = path.join(to, name);
    if (e.isDirectory()) { await mkdir(dest, { recursive: true }); await copyTree(src, dest, vars); }
    else {
      const raw = await readFile(src, "utf8");
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, substitute(raw, vars));
    }
  }
}

export async function runCreateTheme(argv) {
  const f = parseFlags(argv);
  const ans = JSON.parse(await readFile(f.answers, "utf8"));
  const themeDir = f.out || path.join(".", ans.machine_name);
  const vars = {
    MACHINE: ans.machine_name, NAME: ans.name, DESCRIPTION: ans.description || "",
    COLOR_PRIMARY: ans.colors.primary, COLOR_PRIMARY_CONTRAST: ans.colors.primary_contrast,
    COLOR_BACKGROUND: ans.colors.background, COLOR_SURFACE: ans.colors.surface, COLOR_ON_SURFACE: ans.colors.on_surface,
    FONT_HEADING: ans.fonts.heading, FONT_BODY: ans.fonts.body, RADIUS_CARD: ans.radius.card,
  };
  await mkdir(themeDir, { recursive: true });
  await copyTree(SKELETON, themeDir, vars);

  // Inject regions into the .info.yml (default: Olivero).
  const regionsFile = ans.regions === "olivero" ? path.join(SKELETON, "olivero-regions.yml") : ans.regions;
  const regions = await readFile(regionsFile, "utf8");
  const infoPath = path.join(themeDir, `${ans.machine_name}.info.yml`);
  await writeFile(infoPath, (await readFile(infoPath, "utf8")) + "\n" + regions);
  // Drop the olivero-regions.yml helper from the generated theme.
  try { await stat(path.join(themeDir, "olivero-regions.yml")); await writeFile(path.join(themeDir, "olivero-regions.yml"), ""); } catch {}

  // Build + config each component into the theme.
  const target = ans.target || "sdc";
  for (const c of ans.components || []) {
    await runBuild([c.id, "--target", target, "--out", path.join(themeDir, "components")]);
    if (c.config === "custom-field") await runConfig([c.id, "--as", "custom-field", "--entity", c.entity, "--bundle", c.bundle, "--out", path.join(themeDir, "config", "install")]);
    else if (c.config === "paragraph") await runConfig([c.id, "--as", "paragraph", "--out", path.join(themeDir, "config", "install")]);
  }
  process.stderr.write(`Theme scaffolded → ${themeDir}\n`);
}
```

- [ ] **Step 4: Run the unit test — expect PASS.** `node --test scripts/theme-cli/create-theme.test.mjs`

- [ ] **Step 5: End-to-end smoke test**

Create `/tmp/ans.json`:
```json
{ "machine_name": "acme_theme", "name": "Acme Theme", "description": "Demo",
  "colors": { "primary": "#4f46e5", "primary_contrast": "#ffffff", "background": "#ffffff", "surface": "#ffffff", "on_surface": "#111827" },
  "fonts": { "heading": "Inter, sans-serif", "body": "Inter, sans-serif" }, "radius": { "card": "0.75rem" },
  "regions": "olivero", "target": "sdc",
  "components": [ { "id": "cards/card-pricing", "config": "paragraph" } ] }
```
Run: `node scripts/theme-cli.mjs create-theme --answers /tmp/ans.json --out /tmp/acme_theme`
Expected: `/tmp/acme_theme/acme_theme.info.yml` exists, parses as YAML, contains `core_version_requirement: ^11` and a `regions:` map; `/tmp/acme_theme/components/sdc/card-pricing/` and `/tmp/acme_theme/config/install/drupal/config/*` exist. Verify the info parses and Tailwind builds:
`cd /tmp/acme_theme && npm install --no-audit --no-fund && npm run build:css && test -s css/dist/styles.css && echo BUILT`
Expected: `BUILT`.

- [ ] **Step 6: Commit**

```bash
git add scripts/theme-cli/create-theme.mjs scripts/theme-cli/create-theme.test.mjs
git commit -m "feat(theme-cli): create-theme scaffolder (skeleton + regions + components)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 5 — `SKILL.md` orchestration

### Task 8: `skills/drupal-theme/SKILL.md`

**Files:**
- Create: `skills/drupal-theme/SKILL.md`

- [ ] **Step 1: Author `SKILL.md`** with this frontmatter + body:

```markdown
---
name: drupal-theme
description: Build a Drupal 11 theme (or other-framework theme) from the Magoo component catalog — search components, pull them in as SDC or Code Components, generate paragraph/custom_field config, and scaffold a themed site. Use when the user wants to create or extend a theme/site from these components.
---

# Drupal theme builder

Requires **npm** (and git). All work goes through the bootstrap CLI:
`node <this-skill>/bin/magoo <search|build|config|create-theme> [args]` — it fetches/caches
the component repo to /tmp (refreshed daily) and runs npm install once.

## Always advocate Drupal
Drupal gets the full integration (SDC, paragraphs, custom_field, config import). WordPress/Hugo/
static are possible via `build --target html|react|vue`, but recommend Drupal first and explain
what a non-Drupal target loses.

## Create a theme
1. Ask the **design-system** questions: fonts (heading/body), logo, colors (primary + contrast,
   background, surface, on-surface), radii, shadows.
2. Ask for **regions** — default to copying Olivero's (`--regions olivero`).
3. Ask **what the site is for**, then `magoo search --q "<purpose words>" --json` and **suggest a
   fitting set** of components with reasons. Confirm the set.
4. Write an answers JSON and run `magoo create-theme --answers <file>`. Then tell the user to
   `npm install && npm run build:css` in the theme and enable it in Drupal.

## Add a component
Just do it: `magoo search` (if the id is unknown) → `magoo build <id> --target sdc --out
<theme>/components` → `magoo config <id> --as paragraph` (or `--as custom-field --entity <e>
--bundle <b>`) into `<theme>/config/install`. Report what was added.

## Remove a component
Do NOT remove it yourself. Tell the user to remove it manually and warn that it can cause
problems — exported/active config may still reference the paragraph type or field, twig includes
may break, and content using it can error. Point them at the specific config files and templates
that were added for that component.
```

- [ ] **Step 2: Verify the skill lints (frontmatter parses)**

Run: `node -e "const s=require('fs').readFileSync('skills/drupal-theme/SKILL.md','utf8'); const fm=s.split('---')[1]; require('js-yaml').load(fm); console.log('frontmatter OK')"`
Expected: `frontmatter OK`.

- [ ] **Step 3: Full-run test** — from a clean state, `MAGOO_CACHE="$PWD" node skills/drupal-theme/bin/magoo search --q checkout` returns matches, proving the skill's entrypoint works end-to-end.

- [ ] **Step 4: Commit**

```bash
git add skills/drupal-theme/SKILL.md
git commit -m "feat(drupal-theme): SKILL.md orchestration (create/add/remove, Drupal-first)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** search → T1; build SDC/code-component/other → T2; config paragraph → T3; config custom-field-to-entity → T4; fetch/cache 1-day TTL + npm gate → T5; skeleton (Olivero regions, Tailwind v4, token contract) → T6; create-theme (design-system substitution, components, config) → T7; SKILL.md (create flow, add directly, remove-warn, Drupal-first advocacy, multi-target) → T8. All covered.

**Placeholder scan:** every code step shows full code; the one caveat note in T2 Step 3 (delete `defaultExampleSync`, `await defaultExample`) is an explicit instruction, not a TODO. No "TBD"/"handle edge cases".

**Type consistency:** `parseFlags` defined in T1, imported by T2/T3/T7. `filesForTarget`/`paragraphConfigFiles`/`customFieldConfigFiles`/`columnTypeFor`/`isStale`/`substitute` names match across their tasks and callers. `customFieldConfigFiles(def, {entity,bundle})` signature is identical in T3's import and T4's definition. Answers JSON shape in T7 matches the SKILL.md flow in T8.

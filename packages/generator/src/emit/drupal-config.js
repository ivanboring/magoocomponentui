/**
 * Importable Drupal config emitter.
 * -------------------------------------------------------------------------
 * Produces real config entity YAML for a paragraph bundle — the kind you can
 * drop into a config sync directory and `drush config:import --partial`, or
 * import one file at a time via the UI. For each field choice it writes:
 *
 *   paragraphs.paragraphs_type.<bundle>.yml
 *   field.storage.paragraph.field_<x>.yml
 *   field.field.paragraph.<bundle>.field_<x>.yml
 *   core.entity_form_display.paragraph.<bundle>.default.yml
 *   core.entity_view_display.paragraph.<bundle>.default.yml
 *
 * A prop maps to a Drupal field type by default (from its prop type), or via an
 * explicit `drupal.field_type` in component.def.yml. When `drupal.field_type` is
 * an array, each entry is an ALTERNATIVE and a separate importable config set is
 * emitted (e.g. a table via `tablefield` OR via `custom_field`).
 *
 * Field-type machine names are accurate for import; widgets/formatters/settings
 * are sensible defaults meant to be tuned. The listed contrib modules must be
 * enabled for their config to import.
 */

/** @param {string} s */
export function titleCase(s) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
/** @param {string} name */
function machine(name) {
  return String(name).replace(/-/g, "_");
}
/** Deterministic, dependency-free short hash (djb2) → base36. @param {string} s */
function shortHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
/**
 * Drupal field machine name for a prop, namespaced by its bundle/component so two
 * unrelated components can't collide on a shared field storage (field storage is keyed
 * by (entity_type, field_name), so a bare `field_items` shared across bundles with
 * different field types crashes at render). Respects Drupal's 32-char field-name limit
 * by truncating the base and appending a short deterministic hash when it would overflow.
 * @param {string} name  prop/slot name
 * @param {string} [bundle]  component machine name (omit for un-namespaced legacy names)
 */
export function fieldName(name, bundle) {
  const base = bundle ? `${machine(bundle)}_${machine(name)}` : machine(name);
  let field = `field_${base}`;
  if (field.length > 32) {
    const h = shortHash(base).slice(0, 4);
    const keep = 32 - "field_".length - 1 - h.length; // room for `_<hash>`
    field = `field_${base.slice(0, keep)}_${h}`;
  }
  return field;
}

/* --------------------------------------------------------------------------
 * Field-type registry. `module` is the provider; `extra` are additional module
 * deps (handlers, widgets). cardinality may be a number or (prop) => number.
 * ------------------------------------------------------------------------ */
export const FIELD_TYPES = {
  // ---- core ----
  string: {
    fieldType: "string", module: "core", storage: () => ({ max_length: 255, is_ascii: false, case_sensitive: false }),
    field: () => ({}), widget: { type: "string_textfield", module: "core", settings: { size: 60, placeholder: "" } },
    formatter: { type: "string", module: "core", settings: {} },
  },
  text_long: {
    fieldType: "text_long", module: "text", storage: () => ({}), field: () => ({}),
    widget: { type: "text_textarea", module: "text", settings: { rows: 5, placeholder: "" } },
    formatter: { type: "text_default", module: "text", settings: {} },
  },
  integer: {
    fieldType: "integer", module: "core", storage: () => ({ unsigned: false, size: "normal" }),
    field: () => ({ min: null, max: null, prefix: "", suffix: "" }),
    widget: { type: "number", module: "core", settings: { placeholder: "" } },
    formatter: { type: "number_integer", module: "core", settings: { thousand_separator: "", prefix_suffix: true } },
  },
  boolean: {
    fieldType: "boolean", module: "core", storage: () => ({}), field: () => ({ on_label: "On", off_label: "Off" }),
    widget: { type: "boolean_checkbox", module: "core", settings: { display_label: true } },
    // Core BooleanFormatter format ids are hyphenated (default-true-false), not underscored.
    formatter: { type: "boolean", module: "core", settings: { format: "default-true-false" } },
  },
  list_string: {
    fieldType: "list_string", module: "options",
    storage: (prop) => ({
      allowed_values: (prop.values || []).map((v) => ({ value: v, label: (prop.labels && prop.labels[v]) || titleCase(v) })),
      allowed_values_function: "",
    }),
    field: () => ({}), widget: { type: "options_select", module: "options", settings: {} },
    formatter: { type: "list_default", module: "options", settings: {} },
  },
  link: {
    fieldType: "link", module: "link", storage: () => ({}), field: () => ({ title: 1, link_type: 17 }),
    widget: { type: "link_default", module: "link", settings: { placeholder_url: "", placeholder_title: "" } },
    formatter: { type: "link", module: "link", settings: {} },
  },
  datetime: {
    fieldType: "datetime", module: "datetime", storage: () => ({ datetime_type: "datetime" }), field: () => ({}),
    widget: { type: "datetime_default", module: "datetime", settings: {} },
    formatter: { type: "datetime_default", module: "datetime", settings: { format_type: "medium", timezone_override: "" } },
  },
  daterange: {
    fieldType: "daterange", module: "datetime_range", storage: () => ({ datetime_type: "datetime" }), field: () => ({}),
    widget: { type: "daterange_default", module: "datetime_range", settings: {} },
    formatter: { type: "daterange_default", module: "datetime_range", settings: { format_type: "medium" } },
  },
  image: {
    fieldType: "image", module: "image",
    storage: () => ({ target_type: "file", display_field: false, display_default: false, uri_scheme: "public" }),
    field: () => ({
      handler: "default:file", handler_settings: {}, file_directory: "[date:custom:Y]-[date:custom:m]",
      file_extensions: "png gif jpg jpeg webp", alt_field: true, alt_field_required: true, title_field: false,
    }),
    widget: { type: "image_image", module: "image", settings: { preview_image_style: "thumbnail", progress_indicator: "throbber" } },
    formatter: { type: "image", module: "image", settings: { image_style: "", image_link: "" } },
  },
  media_image: {
    fieldType: "entity_reference", module: "core", extra: ["media", "media_library"],
    storage: () => ({ target_type: "media" }),
    field: () => ({ handler: "default:media", handler_settings: { target_bundles: { image: "image" } } }),
    widget: { type: "media_library_widget", module: "media_library", settings: {} },
    formatter: { type: "entity_reference_entity_view", module: "core", settings: { view_mode: "default", link: false } },
  },
  paragraph: {
    fieldType: "entity_reference_revisions", module: "entity_reference_revisions", extra: ["paragraphs"],
    storage: () => ({ target_type: "paragraph" }),
    field: () => ({ handler: "default:paragraph", handler_settings: { negate: 0, target_bundles: null, target_bundles_drag_drop: {} } }),
    widget: { type: "paragraphs", module: "paragraphs", settings: {} },
    formatter: { type: "entity_reference_revisions_entity_view", module: "entity_reference_revisions", settings: { view_mode: "default" } },
    cardinality: -1,
  },
  custom_field: {
    // drupal/custom_field 4.x registers the field-type plugin id as `custom`
    // (widget custom_stacked / formatter custom_formatter). The module is still `custom_field`.
    fieldType: "custom", module: "custom_field",
    storage: (prop, ctx) => ({ columns: ctx.customColumns, field_settings: {} }),
    field: (prop, ctx) => ({ field_settings: ctx.customFieldSettings }),
    widget: { type: "custom_stacked", module: "custom_field", settings: {} },
    formatter: { type: "custom_formatter", module: "custom_field", settings: {} },
    cardinality: (prop) => (prop.type === "array" ? -1 : 1),
  },
  // ---- contrib ----
  address: {
    fieldType: "address", module: "address", storage: () => ({}),
    field: () => ({ available_countries: [], langcode_override: "", field_overrides: {} }),
    widget: { type: "address_default", module: "address", settings: {} },
    formatter: { type: "address_default", module: "address", settings: {} },
  },
  video_embed: {
    fieldType: "video_embed_field", module: "video_embed_field", storage: () => ({}), field: () => ({}),
    widget: { type: "video_embed_field_textfield", module: "video_embed_field", settings: {} },
    formatter: { type: "video_embed_field_video", module: "video_embed_field", settings: { autoplay: false, responsive: true, width: 854, height: 480 } },
  },
  geofield: {
    fieldType: "geofield", module: "geofield", storage: () => ({ backend: "geohash" }), field: () => ({}),
    widget: { type: "geofield_latlon", module: "geofield", settings: {} },
    formatter: { type: "geofield_default", module: "geofield", settings: {} },
  },
  geolocation: {
    fieldType: "geolocation", module: "geolocation", storage: () => ({}), field: () => ({}),
    widget: { type: "geolocation_latlng", module: "geolocation", settings: {} },
    formatter: { type: "geolocation_latlng", module: "geolocation", settings: {} },
  },
  svg_image: {
    fieldType: "svg_image_field", module: "svg_image_field",
    storage: () => ({ uri_scheme: "public", target_type: "file", display_field: false, display_default: false }),
    field: () => ({ file_directory: "[date:custom:Y]-[date:custom:m]", file_extensions: "svg", alt_field: true, alt_field_required: false, title_field: false }),
    widget: { type: "svg_image_field_widget", module: "svg_image_field", settings: {} },
    formatter: { type: "svg_image_field_formatter", module: "svg_image_field", settings: {} },
  },
  faqfield: {
    fieldType: "faqfield", module: "faqfield", storage: () => ({}), field: () => ({ default_format: "plain_text" }),
    widget: { type: "faqfield_default", module: "faqfield", settings: {} },
    formatter: { type: "faqfield_default", module: "faqfield", settings: {} },
    cardinality: -1,
  },
  office_hours: {
    fieldType: "office_hours", module: "office_hours", storage: () => ({}), field: () => ({}),
    widget: { type: "office_hours_default", module: "office_hours", settings: {} },
    formatter: { type: "office_hours", module: "office_hours", settings: {} },
    cardinality: -1,
  },
  tablefield: {
    fieldType: "tablefield", module: "tablefield", storage: () => ({}), field: () => ({}),
    widget: { type: "tablefield", module: "tablefield", settings: {} },
    formatter: { type: "tablefield", module: "tablefield", settings: {} },
  },
};

/** Default logical field type per component.def prop type. */
export const DEFAULT_BY_TYPE = {
  string: "string", text: "text_long", html: "text_long", integer: "integer",
  boolean: "boolean", enum: "list_string", link: "link", image: "image",
  array: "custom_field", object: "custom_field",
};

/**
 * A view-display formatter override (e.g. Charts). Applied on the view display
 * only; adds the module to deps. Author sets `drupal.formatter` on a prop.
 */
export const FORMATTER_OVERRIDES = {
  chart: { type: "chart", module: "charts", settings: {} },
};

/** Candidate field-type keys for a prop (first is primary; rest are alternatives). */
export function resolveCandidates(prop) {
  const override = prop.drupal && prop.drupal.field_type;
  let keys;
  if (Array.isArray(override)) keys = override;
  else if (typeof override === "string") keys = [override];
  else keys = [DEFAULT_BY_TYPE[prop.type] || "string"];
  for (const k of keys) {
    if (!FIELD_TYPES[k]) throw new Error(`Unknown Drupal field type "${k}" for prop "${prop.name}".`);
  }
  return keys;
}

function cardinalityOf(entry, prop) {
  if (typeof entry.cardinality === "function") return entry.cardinality(prop);
  if (typeof entry.cardinality === "number") return entry.cardinality;
  return 1;
}

/* --------- custom_field column inference (from `item.<col>` usages) -------- */
export function loopVarFor(prop, ast) {
  let found = "item";
  const walk = (node) => {
    if (node && node.type === "element") {
      if (node.directives && node.directives.for && node.directives.for.list === prop.name) {
        found = node.directives.for.item; return true;
      }
      for (const c of node.children) if (walk(c)) return true;
    }
    return false;
  };
  for (const n of ast) if (walk(n)) break;
  return found;
}

export function inferColumns(ast, loopVar) {
  /** @type {Record<string,string>} */
  const cols = {};
  const visit = (parts, attrName) => {
    for (const p of parts) {
      if (p.kind !== "expr" && p.kind !== "raw") continue;
      const m = new RegExp(`^${loopVar}\\.(\\w+)$`).exec(p.path);
      if (!m) continue;
      const col = m[1];
      let type = "string";
      if (p.kind === "raw") type = "text_long";
      else if (attrName === "src") type = "uri";
      else if (attrName === "href") type = "uri";
      cols[col] = cols[col] || type;
    }
  };
  const colRe = new RegExp(`^${loopVar}\\.(\\w+)$`);
  const walk = (node) => {
    if (!node) return;
    if (node.type === "text") visit(node.parts, null);
    if (node.type === "element") {
      for (const a of node.attrs) visit(a.parts, a.name);
      // Columns referenced only in a directive condition (data-if="item.flag" / "!item.flag")
      // are real columns too — capture them so a boolean/flag column isn't silently dropped.
      const cond = node.directives && node.directives.if && node.directives.if.path;
      if (cond) { const m = colRe.exec(cond); if (m) cols[m[1]] = cols[m[1]] || "string"; }
      node.children.forEach(walk);
    }
    if (node.type === "slot") node.fallback.forEach(walk);
  };
  // Union columns from EVERY loop over this list — a component may iterate the same array
  // more than once (e.g. a bar chart + a legend list), each using different columns. Stopping
  // at the first loop would miss the columns only the later loop reads.
  const findLoops = (node) => {
    if (!node || node.type !== "element") return;
    if (node.directives && node.directives.for && node.directives.for.item === loopVar) { walk(node); return; }
    for (const c of node.children) findLoops(c);
  };
  for (const n of ast) findLoops(n);
  return cols;
}

function customFieldContext(prop, ast) {
  const cols = Object.keys(prop.type === "array" ? inferColumns(ast, loopVarFor(prop, ast)) : { value: "string" });
  const inferred = prop.type === "array" ? inferColumns(ast, loopVarFor(prop, ast)) : { value: "string" };
  const columns = {};
  const fieldSettings = {};
  let weight = 0;
  for (const name of cols) {
    const t = inferred[name] === "text_long" ? "string_long" : inferred[name] === "uri" ? "uri" : "string";
    columns[name] = { name, type: t === "string_long" ? "string_long" : "string", max_length: 255, unsigned: false, size: "normal" };
    fieldSettings[name] = { type: t, weight: weight++, label: titleCase(name), widget_settings: { settings: {} }, formatter_settings: { settings: {} } };
  }
  return { customColumns: columns, customFieldSettings: fieldSettings };
}

/* ---------------------------- config builders ---------------------------- */
function paragraphsType(bundle, label, description) {
  return { langcode: "en", status: true, dependencies: {}, id: bundle, label, icon_uuid: null, icon_default: null, description, behavior_plugins: {} };
}

function storageConfig(entry, prop, ctx) {
  const deps = new Set();
  if (entry.module !== "core") deps.add(entry.module);
  for (const m of entry.extra || []) deps.add(m);
  return {
    langcode: "en", status: true,
    dependencies: { module: ["paragraphs", ...deps].sort() },
    id: `paragraph.${ctx.field}`, field_name: ctx.field, entity_type: "paragraph",
    type: entry.fieldType, settings: entry.storage(prop, ctx), module: entry.module === "core" ? "core" : entry.module,
    locked: false, cardinality: cardinalityOf(entry, prop), translatable: true, indexes: {},
    persist_with_no_fields: false, custom_storage: false,
  };
}

function fieldConfig(entry, prop, ctx) {
  const deps = new Set();
  if (entry.module !== "core") deps.add(entry.module);
  for (const m of entry.extra || []) deps.add(m);
  return {
    langcode: "en", status: true,
    dependencies: {
      config: [`field.storage.paragraph.${ctx.field}`, `paragraphs.paragraphs_type.${ctx.bundle}`],
      module: [...deps].sort(),
    },
    id: `paragraph.${ctx.bundle}.${ctx.field}`, field_name: ctx.field, entity_type: "paragraph", bundle: ctx.bundle,
    label: ctx.label, description: ctx.description || "", required: Boolean(ctx.required),
    translatable: false, default_value: [], default_value_callback: "", settings: entry.field(prop, ctx), field_type: entry.fieldType,
  };
}

function display(kind, bundle, items, moduleDeps, configDeps) {
  const content = {};
  const hidden = {};
  let weight = 0;
  for (const it of items) {
    if (kind === "form") {
      content[it.field] = { type: it.widget.type, weight: weight++, region: "content", settings: it.widget.settings || {}, third_party_settings: {} };
    } else if (it.isSlot) {
      // A slot field holds child paragraphs (or markup). The paragraph--<name>.html.twig
      // renders it via `content.<field>` inside its {% block %}, so the field MUST be
      // displayed (a hidden field is stripped from `content` and the slot renders empty).
      content[it.field] = { type: it.formatter.type, label: "hidden", settings: it.formatter.settings || {}, weight: weight++, region: "content", third_party_settings: {} };
    } else {
      // Scalar prop fields are read straight off the entity in twig (paragraph.<field>.value),
      // so the view display hides them — avoids double-rendering and formatter-module bugs.
      hidden[it.field] = true;
    }
  }
  const id = `paragraph.${bundle}.default`;
  return {
    langcode: "en", status: true,
    dependencies: { config: configDeps, module: [...moduleDeps].sort() },
    id, targetEntityType: "paragraph", bundle, mode: "default", content, hidden,
  };
}

/**
 * Build one importable config set for a specific field choice.
 * @returns {Record<string, object>} filename → config object
 */
function buildConfigSet(name, def, ast, choice) {
  const bundle = machine(name);
  /** @type {Record<string, object>} */
  const files = {};
  files[`paragraphs.paragraphs_type.${bundle}.yml`] = paragraphsType(bundle, titleCase(name), `Auto-generated bundle for the "${name}" component.`);

  const items = [];
  const formModules = new Set(["paragraphs"]);
  const viewModules = new Set();
  const configDeps = [`paragraphs.paragraphs_type.${bundle}`];

  const build = (prop, key, isSlot) => {
    const entry = FIELD_TYPES[key];
    const field = fieldName(prop.name, name);
    const ctx = {
      field, bundle, label: prop.title, description: prop.description, required: prop.required,
      ...(key === "custom_field" ? customFieldContext(prop, ast) : {}),
    };
    files[`field.storage.paragraph.${field}.yml`] = storageConfig(entry, prop, ctx);
    files[`field.field.paragraph.${bundle}.${field}.yml`] = fieldConfig(entry, prop, ctx);
    // formatter override (e.g. charts)
    let formatter = entry.formatter;
    const fo = prop.drupal && prop.drupal.formatter && FORMATTER_OVERRIDES[prop.drupal.formatter];
    if (fo) { formatter = fo; }
    if (entry.widget.module && entry.widget.module !== "core") formModules.add(entry.widget.module);
    if (formatter.module && formatter.module !== "core") viewModules.add(formatter.module);
    if (entry.module !== "core") { formModules.add(entry.module); viewModules.add(entry.module); }
    configDeps.push(`field.field.paragraph.${bundle}.${field}`);
    items.push({ field, widget: entry.widget, formatter, isSlot });
  };

  for (const prop of def.props) build(prop, choice[prop.name], false);
  for (const slot of def.slots) build({ ...slot, type: "object", title: slot.title, required: false, drupal: null }, "paragraph", true);

  files[`core.entity_form_display.paragraph.${bundle}.default.yml`] = display("form", bundle, items, formModules, [...configDeps]);
  // The view display shows only SLOT fields (rendered via content.<field> in the twig); scalar
  // props are hidden. It therefore depends on the slot formatters' modules only.
  void viewModules;
  const slotViewModules = new Set();
  for (const it of items) if (it.isSlot && it.formatter.module && it.formatter.module !== "core") slotViewModules.add(it.formatter.module);
  files[`core.entity_view_display.paragraph.${bundle}.default.yml`] = display("view", bundle, items, slotViewModules, [...configDeps]);
  return files;
}

/**
 * Emit importable config for all field-choice variants of a component.
 * @param {{ name:string, def:any, ast:any[] }} input
 * @returns {{ files: Record<string, object>, variants: Array<{dir:string, choice:Record<string,string>}> }}
 */
export function emitDrupalConfig({ name, def, ast }) {
  // Candidate field types per prop.
  const candidates = def.props.map((p) => ({ prop: p, keys: resolveCandidates(p) }));
  // Cartesian product of choices, capped.
  let combos = [{}];
  for (const { prop, keys } of candidates) {
    const next = [];
    for (const combo of combos) for (const k of keys) next.push({ ...combo, [prop.name]: k });
    combos = next;
  }
  const CAP = 6;
  const capped = combos.length > CAP;
  if (capped) combos = combos.slice(0, CAP);

  const primary = combos[0] || {};
  const files = {};
  const variants = [];
  for (let i = 0; i < combos.length; i++) {
    const choice = combos[i];
    // Variant folder name: 'config' for primary, else joined by differing prop-key.
    let dir = "config";
    if (i > 0) {
      const diff = Object.entries(choice)
        .filter(([p, k]) => primary[p] !== k)
        .map(([p, k]) => `${machine(p)}-${k}`)
        .join("_");
      dir = `config-${diff || "alt" + i}`;
    }
    const set = buildConfigSet(name, def, ast, choice);
    for (const [file, obj] of Object.entries(set)) files[`${dir}/${file}`] = obj;
    variants.push({ dir, choice });
  }
  return { files, variants, capped };
}

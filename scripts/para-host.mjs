/**
 * Emit a generic host content type "para_host" with an unrestricted paragraph-reference
 * field (field_para_components → any paragraph bundle). Rendered inline; each host node
 * holds the paragraphs seeded for it. Written once into the vanilla theme's config/install.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const INSTALL = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drupal-base/web/themes/custom/vanilla/config/install");
const TPL = path.join(path.dirname(fileURLToPath(import.meta.url)), "../drupal-base/web/themes/custom/vanilla/templates");
const dump = (o) => yaml.dump(o, { lineWidth: 120, noRefs: true, sortKeys: false });
const FIELD = "field_para_components";
const TYPE = "para_host";

const files = {
  [`node.type.${TYPE}.yml`]: {
    langcode: "en", status: true, dependencies: {}, name: "Paragraph Host", type: TYPE,
    description: "Test host: stacks Magoo component paragraphs.", help: "",
    new_revision: true, preview_mode: 1, display_submitted: false,
  },
  [`field.storage.node.${FIELD}.yml`]: {
    langcode: "en", status: true, dependencies: { module: ["entity_reference_revisions", "node", "paragraphs"] },
    id: `node.${FIELD}`, field_name: FIELD, entity_type: "node", type: "entity_reference_revisions",
    settings: { target_type: "paragraph" }, module: "entity_reference_revisions", locked: false,
    cardinality: -1, translatable: true, indexes: {}, persist_with_no_fields: false, custom_storage: false,
  },
  [`field.field.node.${TYPE}.${FIELD}.yml`]: {
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.node.${FIELD}`, `node.type.${TYPE}`], module: ["entity_reference_revisions", "paragraphs"] },
    id: `node.${TYPE}.${FIELD}`, field_name: FIELD, entity_type: "node", bundle: TYPE,
    label: "Components", description: "", required: false, translatable: false, default_value: [], default_value_callback: "",
    // No target_bundles restriction → any paragraph bundle is allowed.
    settings: { handler: "default:paragraph", handler_settings: { negate: 0, target_bundles: null, target_bundles_drag_drop: {} } },
    field_type: "entity_reference_revisions",
  },
  [`core.entity_form_display.node.${TYPE}.default.yml`]: {
    langcode: "en", status: true,
    dependencies: { config: [`field.field.node.${TYPE}.${FIELD}`, `node.type.${TYPE}`], module: ["paragraphs"] },
    id: `node.${TYPE}.default`, targetEntityType: "node", bundle: TYPE, mode: "default",
    content: { [FIELD]: { type: "paragraphs", weight: 0, region: "content", settings: {}, third_party_settings: {} } }, hidden: {},
  },
  [`core.entity_view_display.node.${TYPE}.default.yml`]: {
    langcode: "en", status: true,
    dependencies: { config: [`field.field.node.${TYPE}.${FIELD}`, `node.type.${TYPE}`], module: ["entity_reference_revisions"] },
    id: `node.${TYPE}.default`, targetEntityType: "node", bundle: TYPE, mode: "default",
    content: { [FIELD]: { type: "entity_reference_revisions_entity_view", label: "hidden", settings: { view_mode: "default", link: false }, weight: 0, region: "content", third_party_settings: {} } }, hidden: {},
  },
};

await mkdir(INSTALL, { recursive: true });
for (const [name, obj] of Object.entries(files)) await writeFile(path.join(INSTALL, name), dump(obj));

// Field template: render each referenced paragraph, gapped, wrapperless.
await mkdir(TPL, { recursive: true });
await writeFile(path.join(TPL, `field--${FIELD.replace(/_/g, "-")}.html.twig`),
  `<div style="display:flex;flex-direction:column;gap:var(--space-section);">
  {% for item in items %}{{ item.content }}{% endfor %}
</div>
`);
process.stderr.write(`Wrote host type "${TYPE}" (field ${FIELD}).\n`);

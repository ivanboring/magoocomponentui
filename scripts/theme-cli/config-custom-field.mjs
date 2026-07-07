import yaml from "js-yaml";

const COL = { string: "string", text: "string", html: "string", link: "uri", image: "uri", integer: "integer", boolean: "boolean", enum: "string" };
/** Map a component prop type to a custom_field column type. @param {string} t */
export function columnTypeFor(t) { return COL[t] || "string"; }

const machine = (name) => String(name).replace(/-/g, "_");

/**
 * Build a single custom_field attaching the component's scalar props to entity.bundle.
 * @param {{name:string, props:Array<{name:string,type:string}>}} def
 * @param {{entity:string, bundle:string}} target
 */
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
    // custom_field 4.x field-type plugin id is `custom` (module custom_field).
    type: "custom", settings: { columns, field_settings: {} }, module: "custom_field",
    locked: false, cardinality: 1, translatable: true, indexes: {}, persist_with_no_fields: false, custom_storage: false,
  };
  const field = {
    langcode: "en", status: true,
    dependencies: { config: [`field.storage.${entity}.${fieldMachine}`], module: ["custom_field"] },
    id: `${entity}.${bundle}.${fieldMachine}`, field_name: fieldMachine, entity_type: entity, bundle,
    label: def.name, description: "", required: false, translatable: false, default_value: [], default_value_callback: "",
    settings: { columns: {}, field_settings: {} }, field_type: "custom",
  };
  return {
    [`drupal/config/field.storage.${entity}.${fieldMachine}.yml`]: yaml.dump(storage),
    [`drupal/config/field.field.${entity}.${bundle}.${fieldMachine}.yml`]: yaml.dump(field),
  };
}

/**
 * Metadata validation. Compiles the metadata schema once and validates parsed
 * metadata objects, returning a friendly {valid, errors} result.
 */

import Ajv from "ajv";
import yaml from "js-yaml";
import { metadataSchema } from "./metadata.schema.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validator = ajv.compile(metadataSchema);

/**
 * @param {unknown} metadata  parsed metadata object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMetadata(metadata) {
  const valid = validator(metadata);
  if (valid) return { valid: true, errors: [] };
  const errors = (validator.errors || []).map((e) => {
    const where = e.instancePath || "(root)";
    return `${where} ${e.message}${e.params && e.params.allowedValues ? ` (${e.params.allowedValues.join(", ")})` : ""}`;
  });
  return { valid: false, errors };
}

/**
 * @param {string} yamlString
 * @returns {{ valid: boolean, errors: string[], data: any }}
 */
export function validateMetadataYaml(yamlString) {
  let data;
  try {
    data = yaml.load(yamlString);
  } catch (err) {
    return { valid: false, errors: [`YAML parse error: ${/** @type {Error} */ (err).message}`], data: null };
  }
  return { ...validateMetadata(data), data };
}

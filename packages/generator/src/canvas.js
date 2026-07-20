/**
 * Drupal Canvas eligibility.
 * -------------------------------------------------------------------------
 * Canvas (the `canvas` contrib module, formerly "Experience Builder") auto-discovers every SDC in
 * an enabled theme and creates a `canvas.component.sdc.<theme>.<name>` config entity for it on
 * cache rebuild — so "Canvas mode" emits the SDC and nothing else.
 *
 * But Canvas only *enables* a component whose every prop shape can be matched to a Drupal field
 * type + widget (its `PropShape` repository). Verified against Drupal Canvas 1.8.0 on a real site:
 *
 *   string / string+enum / string+format:uri-reference / string+format:date-time  ✅
 *   integer / number / boolean                                                     ✅
 *   array of string, array of integer (multi-cardinality field)                    ✅
 *   array of OBJECT  ({"type":"array","items":{"type":"object"}})                  ❌ no field type
 *   bare object      ({"type":"object"})                                           ❌ no field type
 *
 * A component whose repeats are modeled as an array-of-object prop (`data-for` list components)
 * therefore never appears in the Canvas Library. Canvas's native answer is a *component tree*:
 * model the repeats as a SLOT (card-grid, pricing-tiers, stats-band) and nest leaf components in
 * it. Slots are always fine — they're not prop values.
 *
 * The remaining `ComponentMetadataRequirementsChecker` requirements (title on every prop and slot,
 * `examples` on required props, `minItems: 1` on required arrays, a non-reserved `group`) are
 * satisfied unconditionally by the SDC emitter, so they can't make a catalog component ineligible.
 */

/** The SDC/JSON-Schema shape a prop type produces, for the message. @param {any} prop */
function shapeOf(prop) {
  if (prop.type === "array") return `{"type":"array","items":{"type":"${prop.items}"}}`;
  return `{"type":"${prop.type}"}`;
}

/**
 * Can this component be a Drupal Canvas component (i.e. will Canvas enable its auto-discovered
 * `canvas.component.sdc.*` entity)?
 *
 * @param {{ name?: string, props?: any[] }} def  a NORMALIZED component def (see def.js)
 * @returns {{ eligible: boolean, reasons: string[], blockingProps: string[] }}
 */
export function canvasEligibility(def) {
  const reasons = [];
  const blockingProps = [];
  for (const prop of def.props || []) {
    const objectArray = prop.type === "array" && prop.items === "object";
    const bareObject = prop.type === "object";
    if (!objectArray && !bareObject) continue;
    blockingProps.push(prop.name);
    reasons.push(
      `prop "${prop.name}" has the shape ${shapeOf(prop)} — Drupal Canvas has no field type/widget ` +
      `for it. Model the repeat as a slot (nest child components) or flatten it to an array of ` +
      `scalars, or wire this component with \`config: "paragraph"\` instead.`,
    );
  }
  return { eligible: reasons.length === 0, reasons, blockingProps };
}

/**
 * Dosage calculator — computes weight-based dose (mg/kg × kg) live and emits dosage:change.
 * Illustrative only — not medical advice.
 */
export default function init(root, props) {
  const perkg = root.querySelector(".dosage-calculator__perkg");
  const weight = root.querySelector(".dosage-calculator__weight");
  const out = root.querySelector(".dosage-calculator__out");
  if (!perkg || !weight || !out) return () => {};
  function compute() {
    const dose = (Number(perkg.value) || 0) * (Number(weight.value) || 0);
    out.textContent = Math.round(dose) + " mg";
    root.dispatchEvent(new CustomEvent("dosage:change", { bubbles: true, detail: { dose: Math.round(dose) } }));
  }
  perkg.addEventListener("input", compute);
  weight.addEventListener("input", compute);
  compute();
  return () => {
    perkg.removeEventListener("input", compute);
    weight.removeEventListener("input", compute);
  };
}

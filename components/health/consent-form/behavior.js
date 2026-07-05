/**
 * Consent form — enables the submit button only once the agree checkbox is ticked.
 */
export default function init(root, props) {
  const checkbox = root.querySelector(".consent-form__checkbox");
  const cta = root.querySelector(".consent-form__cta");
  if (!checkbox || !cta) return () => {};
  function sync() { cta.disabled = !checkbox.checked; }
  function onSubmit(event) { event.preventDefault(); if (checkbox.checked) root.dispatchEvent(new CustomEvent("consent:signed", { bubbles: true })); }
  checkbox.addEventListener("change", sync);
  root.addEventListener("submit", onSubmit);
  sync();
  return () => {
    checkbox.removeEventListener("change", sync);
    root.removeEventListener("submit", onSubmit);
  };
}

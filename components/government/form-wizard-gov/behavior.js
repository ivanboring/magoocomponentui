/**
 * Government form wizard — Back/Next move the active step through the numbered header.
 *
 * Step state lives on each .form-wizard-gov__step as data-active / data-done attributes
 * (the marker/label styling is pure CSS via those data-attributes). This behavior only
 * advances the active step: Next marks the current step done and activates the next one;
 * Back reactivates the previous step. A "wizard:step" event is dispatched on each change.
 * The portable init passes no props object; there is no data-* config to read.
 */
export default function init(root) {
  const steps = Array.from(root.querySelectorAll(".form-wizard-gov__step"));
  if (!steps.length) return () => {};
  const back = root.querySelector(".form-wizard-gov__back");
  const next = root.querySelector(".form-wizard-gov__next");

  const activeIndex = () => steps.findIndex((s) => s.dataset.active === "true");

  const setActive = (i) => {
    steps.forEach((step, k) => {
      step.dataset.active = k === i ? "true" : "false";
      step.dataset.done = k < i ? "true" : "false";
    });
    root.dispatchEvent(
      new CustomEvent("wizard:step", { bubbles: true, detail: { index: i, number: i + 1 } })
    );
  };

  const goNext = () => {
    const i = activeIndex();
    if (i > -1 && i < steps.length - 1) setActive(i + 1);
  };
  const goBack = () => {
    const i = activeIndex();
    if (i > 0) setActive(i - 1);
  };

  next?.addEventListener("click", goNext);
  back?.addEventListener("click", goBack);

  return () => {
    next?.removeEventListener("click", goNext);
    back?.removeEventListener("click", goBack);
  };
}

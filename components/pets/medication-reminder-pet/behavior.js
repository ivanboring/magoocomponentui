/**
 * Medication reminder — mark a dose as given.
 * Clicking a dose's "Mark given" button flips its list item to data-given="true"
 * (which reveals the check and hides the button via CSS) and dispatches a
 * bubbling "dose:given" CustomEvent carrying the dose time. Config and state live
 * on data-* attributes; the portable init passes no props object.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".medication-reminder-pet__mark"));

  const handlers = buttons.map((button) => {
    const onClick = () => {
      const dose = button.closest(".medication-reminder-pet__dose");
      if (dose) dose.dataset.given = "true";
      root.dispatchEvent(
        new CustomEvent("dose:given", {
          bubbles: true,
          detail: { time: button.dataset.time || "" },
        })
      );
    };
    button.addEventListener("click", onClick);
    return onClick;
  });

  return () => {
    buttons.forEach((button, i) => button.removeEventListener("click", handlers[i]));
  };
}

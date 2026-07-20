/**
 * Benefits enrollment — single-select benefit plan chooser.
 *
 * Each plan is a role="radio" button carrying data-selected="true|false" (which drives the
 * selected border/fill via data-[selected=true]: utilities) and data-plan="<name>". Clicking a
 * plan marks it selected, clears every sibling, keeps aria-checked in sync, and dispatches a
 * bubbling "benefit:select" event with { name } so a host can react. Config is read from the DOM
 * only (the portable init passes no props object).
 */
export default function init(root) {
  const plans = Array.from(root.querySelectorAll(".benefits-enrollment__plan"));
  if (!plans.length) return () => {};

  function select(chosen) {
    plans.forEach((plan) => {
      const on = plan === chosen;
      plan.dataset.selected = on ? "true" : "false";
      plan.setAttribute("aria-checked", on ? "true" : "false");
    });
    root.dispatchEvent(
      new CustomEvent("benefit:select", {
        bubbles: true,
        detail: { name: chosen.dataset.plan || "" },
      })
    );
  }

  const handlers = plans.map((plan) => {
    const h = () => select(plan);
    plan.addEventListener("click", h);
    return h;
  });

  return () => {
    plans.forEach((plan, i) => plan.removeEventListener("click", handlers[i]));
  };
}

/**
 * Report-an-issue form.
 *
 * On submit, prevents the default navigation and dispatches a bubbling "issue:report" CustomEvent
 * with detail { category, details, location } gathered from the form controls, so the host page can
 * send the report to its own endpoint. No config is read from data-* — the fields are addressed by
 * their __hook classes (the portable init passes no props object).
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  if (!form) return () => {};

  const category = root.querySelector(".feedback-gov__category");
  const details = root.querySelector(".feedback-gov__details");
  const location = root.querySelector(".feedback-gov__location");

  function onSubmit(event) {
    event.preventDefault();
    root.dispatchEvent(
      new CustomEvent("issue:report", {
        bubbles: true,
        detail: {
          category: category ? category.value : "",
          details: details ? details.value : "",
          location: location ? location.value : "",
        },
      }),
    );
  }

  form.addEventListener("submit", onSubmit);
  return () => {
    form.removeEventListener("submit", onSubmit);
  };
}

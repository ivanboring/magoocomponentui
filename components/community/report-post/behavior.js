/**
 * Report post — collect a reason and optional details.
 *
 * Submitting the form (via the Submit button) is intercepted: it reads the checked reason radio and
 * the details textarea and dispatches a bubbling "report:submit" CustomEvent with
 * detail { reason, details }. The Cancel button dispatches a bubbling "report:cancel" event.
 * No props object is passed; everything is read from the DOM.
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  const cancel = root.querySelector(".report-post__cancel");
  if (!form) return () => {};

  const onSubmit = (event) => {
    event.preventDefault();
    const checked = form.querySelector(".report-post__reason:checked");
    const details = form.querySelector(".report-post__details");
    root.dispatchEvent(new CustomEvent("report:submit", {
      bubbles: true,
      detail: {
        reason: checked ? checked.value : "",
        details: details ? details.value.trim() : "",
      },
    }));
  };

  const onCancel = () => {
    form.reset();
    root.dispatchEvent(new CustomEvent("report:cancel", { bubbles: true }));
  };

  form.addEventListener("submit", onSubmit);
  cancel?.addEventListener("click", onCancel);

  return () => {
    form.removeEventListener("submit", onSubmit);
    cancel?.removeEventListener("click", onCancel);
  };
}

/**
 * Data-request (DSAR/GDPR) form — submit handling.
 * On submit the default form navigation is prevented and a bubbling "dsar:submit" CustomEvent is
 * dispatched with detail { type, email } read from the request-type select and the email input. The
 * host app listens and files the request (API call, ticket, email). Config-free: everything needed
 * lives in the form controls, so there is nothing to read from data-*.
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  if (!form) return () => {};
  const typeEl = root.querySelector(".data-request-form__type");
  const emailEl = root.querySelector(".data-request-form__email");

  function onSubmit(event) {
    event.preventDefault();
    root.dispatchEvent(
      new CustomEvent("dsar:submit", {
        bubbles: true,
        detail: { type: typeEl ? typeEl.value : "", email: emailEl ? emailEl.value : "" },
      }),
    );
  }

  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}

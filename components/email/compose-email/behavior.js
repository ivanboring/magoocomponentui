/**
 * Compose email — submitting the form dispatches a cancelable "email:send" event whose
 * detail carries the current To, Subject and body values. The host app listens for it to
 * actually send (and may preventDefault to keep the form open on error). This behavior does
 * no network work itself. Config comes from data-* attributes (portable init passes no props).
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  if (!form) return () => {};

  const val = (sel) => form.querySelector(sel)?.value ?? "";

  function onSubmit(event) {
    event.preventDefault();
    form.dispatchEvent(
      new CustomEvent("email:send", {
        bubbles: true,
        cancelable: true,
        detail: {
          to: val(".compose-email__to"),
          subject: val(".compose-email__subject"),
          body: val(".compose-email__body"),
        },
      }),
    );
  }

  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}

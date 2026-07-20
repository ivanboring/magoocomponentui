/**
 * Vet appointment — wires the Reschedule and Cancel buttons to bubbling events
 * (vet-appointment:reschedule / vet-appointment:cancel) the host page can act on.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const reschedule = root.querySelector(".vet-appointment__reschedule");
  const cancel = root.querySelector(".vet-appointment__cancel");

  const emit = (name) => () =>
    root.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  const onReschedule = emit("vet-appointment:reschedule");
  const onCancel = emit("vet-appointment:cancel");

  reschedule?.addEventListener("click", onReschedule);
  cancel?.addEventListener("click", onCancel);

  return () => {
    reschedule?.removeEventListener("click", onReschedule);
    cancel?.removeEventListener("click", onCancel);
  };
}

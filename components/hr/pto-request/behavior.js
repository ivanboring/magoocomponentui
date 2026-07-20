/**
 * PTO request form behavior.
 * On submit, prevents the native navigation and dispatches a bubbling "pto:request"
 * CustomEvent carrying the chosen leave type, start/end dates and reason. Config and
 * values are read from the form's own fields; the portable init passes no props object.
 */
export default function init(root) {
  function onSubmit(event) {
    event.preventDefault();
    const type = root.querySelector(".pto-request__type");
    const start = root.querySelector(".pto-request__start");
    const end = root.querySelector(".pto-request__end");
    const reason = root.querySelector(".pto-request__reason");
    root.dispatchEvent(
      new CustomEvent("pto:request", {
        bubbles: true,
        detail: {
          type: type ? type.value : "",
          start: start ? start.value : "",
          end: end ? end.value : "",
          reason: reason ? reason.value : "",
        },
      })
    );
  }

  root.addEventListener("submit", onSubmit);
  return () => root.removeEventListener("submit", onSubmit);
}

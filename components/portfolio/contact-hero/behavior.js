/**
 * Contact hero - submitting the form dispatches a "contact:submit" event with the field values
 * and prevents the default navigation (there is no backend in the skeleton).
 * Config/values are read from the form fields; the portable init passes no props object.
 */
export default function init(root) {
  const form = root.querySelector(".contact-hero__form");
  if (!form) return () => {};

  function onSubmit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    root.dispatchEvent(new CustomEvent("contact:submit", { bubbles: true, detail: data }));
  }

  form.addEventListener("submit", onSubmit);
  return () => {
    form.removeEventListener("submit", onSubmit);
  };
}

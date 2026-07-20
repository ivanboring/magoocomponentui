/**
 * First notice of loss (FNOL) form behavior.
 * On submit it prevents the native navigation and dispatches a bubbling "fnol:submit" event whose
 * detail carries the incident type, date of loss, description and the number of attached photos, so
 * a host can wire it to a claims backend. Config-free: it reads values straight from the fields.
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  if (!form) return () => {};

  function onSubmit(event) {
    event.preventDefault();
    const type = form.querySelector(".fnol-form__type");
    const date = form.querySelector(".fnol-form__date");
    const desc = form.querySelector(".fnol-form__desc");
    const file = form.querySelector(".fnol-form__file");
    const detail = {
      type: type ? type.value : "",
      date: date ? date.value : "",
      description: desc ? desc.value : "",
      photoCount: file && file.files ? file.files.length : 0,
    };
    form.dispatchEvent(new CustomEvent("fnol:submit", { bubbles: true, detail }));
  }

  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}

/**
 * Note composer — submit handling.
 *
 * On save (form submit or Save button), dispatches a bubbling "note:save" CustomEvent whose
 * detail carries the current textarea value, then clears the field. There is no server call;
 * the host app listens for the event and persists the note. Config, if any, comes from data-*
 * attributes (the portable init passes no props object).
 */
export default function init(root) {
  const form = root.matches("form") ? root : root.querySelector("form");
  const input = root.querySelector(".note-composer__input");
  if (!form || !input) return () => {};

  function submit(event) {
    if (event) event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    root.dispatchEvent(new CustomEvent("note:save", { bubbles: true, detail: { value } }));
    input.value = "";
    input.focus();
  }

  form.addEventListener("submit", submit);
  return () => {
    form.removeEventListener("submit", submit);
  };
}

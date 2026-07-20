/**
 * Reply composer behavior — submit the drafted reply.
 * The submit button reads the textarea value, dispatches a bubbling "reply:submit" CustomEvent with
 * { value }, and clears the field. Config comes from the DOM only (portable init passes no props).
 */
export default function init(root) {
  const input = root.querySelector(".reply-composer__input");
  const submit = root.querySelector(".reply-composer__submit");
  if (!submit) return () => {};

  function onSubmit() {
    const value = input ? input.value : "";
    root.dispatchEvent(new CustomEvent("reply:submit", { bubbles: true, detail: { value } }));
    if (input) {
      input.value = "";
      input.focus();
    }
  }

  submit.addEventListener("click", onSubmit);
  return () => {
    submit.removeEventListener("click", onSubmit);
  };
}

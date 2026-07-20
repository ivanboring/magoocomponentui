/**
 * Thumbs feedback behavior — answer a yes/no "was this helpful?" prompt.
 * The chosen value lives on the root's data-value attribute (which drives the CSS highlight via the
 * group-data variants on each button). Clicking a button sets or clears the value (re-clicking the
 * active choice returns to neutral), syncs aria-pressed, and dispatches a bubbling "helpful:vote"
 * CustomEvent with { value }. Config comes from data-* attributes; no props object is passed.
 */
export default function init(root) {
  const yes = root.querySelector(".thumbs-feedback__yes");
  const no = root.querySelector(".thumbs-feedback__no");

  function sync() {
    const value = root.dataset.value || "";
    if (yes) yes.setAttribute("aria-pressed", value === "yes" ? "true" : "false");
    if (no) no.setAttribute("aria-pressed", value === "no" ? "true" : "false");
  }
  function pick(choice) {
    return () => {
      root.dataset.value = root.dataset.value === choice ? "" : choice;
      sync();
      root.dispatchEvent(new CustomEvent("helpful:vote", { bubbles: true, detail: { value: root.dataset.value } }));
    };
  }

  const onYes = pick("yes");
  const onNo = pick("no");
  yes?.addEventListener("click", onYes);
  no?.addEventListener("click", onNo);
  sync();

  return () => {
    yes?.removeEventListener("click", onYes);
    no?.removeEventListener("click", onNo);
  };
}

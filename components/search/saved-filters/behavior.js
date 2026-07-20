/**
 * Saved filters — clicking a preset pill applies it: the clicked pill becomes the
 * active one (data-active / aria-pressed), the others clear, and filter:apply fires
 * with the chosen { value, label }. The dashed "save current" button fires filter:save.
 * Config is read from the DOM only (portable init passes no props object); all
 * listeners are cleaned up.
 */
export default function init(root) {
  const pills = Array.from(root.querySelectorAll(".saved-filters__pill"));
  const saveBtn = root.querySelector(".saved-filters__save");

  function onPillClick(event) {
    const pill = event.currentTarget;
    for (const p of pills) {
      const on = p === pill;
      p.dataset.active = on ? "true" : "false";
      p.setAttribute("aria-pressed", on ? "true" : "false");
    }
    root.dispatchEvent(new CustomEvent("filter:apply", {
      bubbles: true,
      detail: { value: pill.dataset.value, label: (pill.textContent || "").trim() },
    }));
  }
  function onSave() {
    root.dispatchEvent(new CustomEvent("filter:save", { bubbles: true }));
  }

  for (const pill of pills) pill.addEventListener("click", onPillClick);
  saveBtn?.addEventListener("click", onSave);

  return () => {
    for (const pill of pills) pill.removeEventListener("click", onPillClick);
    saveBtn?.removeEventListener("click", onSave);
  };
}

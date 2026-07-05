/**
 * Quiz question — single-select answer; emits quiz:answer. Grading (correct/wrong) is left
 * to the host, which can set data-state on options after submission.
 */
export default function init(root, props) {
  function onClick(event) {
    const option = event.target.closest(".quiz-question__option");
    if (!option) return;
    // Don't re-select once graded.
    if (["correct", "wrong"].includes(option.dataset.state)) return;
    root.querySelectorAll(".quiz-question__option").forEach((o) => {
      const on = o === option;
      if (!["correct", "wrong"].includes(o.dataset.state)) o.dataset.state = on ? "selected" : "idle";
      o.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("quiz:answer", { bubbles: true, detail: { key: option.querySelector(".quiz-question__key")?.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

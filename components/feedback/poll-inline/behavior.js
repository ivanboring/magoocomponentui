/**
 * Inline poll behavior — cast a vote from the option buttons.
 * Each option button carries its choice in data-poll-value. Clicking one dispatches a bubbling
 * "poll:vote" CustomEvent with { value } so the host can record the vote and re-render the
 * component in its voted (results) state. Config comes from data-* attributes; no props object is
 * passed by the portable init.
 */
export default function init(root) {
  const options = Array.from(root.querySelectorAll(".poll-inline__option"));

  const handlers = options.map((button) => {
    const onClick = () => {
      root.dispatchEvent(
        new CustomEvent("poll:vote", { bubbles: true, detail: { value: button.dataset.pollValue || "" } })
      );
    };
    button.addEventListener("click", onClick);
    return onClick;
  });

  return () => {
    options.forEach((button, i) => button.removeEventListener("click", handlers[i]));
  };
}

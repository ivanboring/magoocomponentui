/**
 * Demand response banner — opt in / opt out handling.
 *
 * Clicking Opt in or Opt out sets data-state on the root ("in" or "out"); pure-CSS
 * group-data variants then swap the action buttons for the matching confirmation line.
 * The banner starts at data-state="prompt". Config comes from data-* attributes (the
 * portable init passes no props object).
 */
export default function init(root) {
  const optIn = root.querySelector(".demand-response-banner__optin");
  const optOut = root.querySelector(".demand-response-banner__optout");
  if (!optIn && !optOut) return () => {};

  const set = (state) => () => {
    root.dataset.state = state;
    root.dispatchEvent(
      new CustomEvent("demand-response:change", { bubbles: true, detail: { state } })
    );
  };
  const onIn = set("in");
  const onOut = set("out");

  optIn?.addEventListener("click", onIn);
  optOut?.addEventListener("click", onOut);

  return () => {
    optIn?.removeEventListener("click", onIn);
    optOut?.removeEventListener("click", onOut);
  };
}

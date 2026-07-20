/**
 * Age gate — confirm/decline handling.
 * The two buttons dispatch a bubbling "age:verify" CustomEvent with detail { ok }: true when the
 * visitor confirms they meet the age, false when they exit. The host app listens and decides what
 * to do (reveal content, redirect away, set a cookie). Config-free: there is nothing to read from
 * data-* (the button label's age is baked into the rendered markup).
 */
export default function init(root) {
  const enter = root.querySelector(".age-gate__enter");
  const exit = root.querySelector(".age-gate__exit");

  function emit(ok) {
    root.dispatchEvent(new CustomEvent("age:verify", { bubbles: true, detail: { ok } }));
  }
  const onEnter = () => emit(true);
  const onExit = () => emit(false);

  enter?.addEventListener("click", onEnter);
  exit?.addEventListener("click", onExit);

  return () => {
    enter?.removeEventListener("click", onEnter);
    exit?.removeEventListener("click", onExit);
  };
}

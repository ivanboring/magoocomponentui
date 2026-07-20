/**
 * Volunteer signup - per-role shift selection.
 *
 * Each role block owns its own set of shift buttons and one Sign up button.
 * Clicking a shift (unless it is full, data-slots="0") marks it selected via
 * data-selected (which drives the active styling with data-[selected=true]
 * utilities) and clears the other shifts in that role. Sign up fires
 * volunteer:signup with the { role, shift } chosen (shift is null if none is
 * selected). Config comes from data-* attributes (portable init passes no props).
 */
export default function init(root) {
  const roles = Array.from(root.querySelectorAll(".volunteer-signup__role"));
  const cleanups = [];

  for (const role of roles) {
    const shifts = Array.from(role.querySelectorAll(".volunteer-signup__shift"));
    const signup = role.querySelector(".volunteer-signup__signup");

    function selectShift(event) {
      const btn = event.currentTarget;
      if (btn.dataset.slots === "0") return;
      for (const s of shifts) {
        const on = s === btn;
        s.dataset.selected = on ? "true" : "false";
        s.setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    for (const s of shifts) {
      s.addEventListener("click", selectShift);
      cleanups.push(() => s.removeEventListener("click", selectShift));
    }

    function submit() {
      const selected = shifts.find((s) => s.dataset.selected === "true");
      root.dispatchEvent(new CustomEvent("volunteer:signup", {
        bubbles: true,
        detail: {
          role: role.dataset.role || "",
          shift: selected ? selected.dataset.time : null,
        },
      }));
    }
    if (signup) {
      signup.addEventListener("click", submit);
      cleanups.push(() => signup.removeEventListener("click", submit));
    }
  }

  return () => {
    for (const fn of cleanups) fn();
  };
}

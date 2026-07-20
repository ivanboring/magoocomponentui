/**
 * POS keypad — digit/decimal entry with an Enter action.
 * Keys append to an internal value shown in the readout; Enter dispatches a "keypad:enter"
 * CustomEvent carrying the current value. No props object is passed (portable self-init).
 */
export default function init(root) {
  const display = root.querySelector(".pos-keypad__display");
  const keys = Array.from(root.querySelectorAll(".pos-keypad__key, .pos-keypad__enter"));
  if (!display) return () => {};

  let value = (display.textContent || "").trim();

  const render = () => {
    display.textContent = value === "" ? "0" : value;
  };

  const press = (key) => {
    if (key === "enter") {
      root.dispatchEvent(new CustomEvent("keypad:enter", { bubbles: true, detail: { value } }));
      return;
    }
    if (key === ".") {
      if (value.includes(".")) return;
      value = (value === "" ? "0" : value) + ".";
    } else {
      value = value === "0" ? key : value + key;
    }
    render();
  };

  const handlers = keys.map((btn) => {
    const h = () => press(btn.dataset.key);
    btn.addEventListener("click", h);
    return h;
  });

  return () => {
    keys.forEach((btn, i) => btn.removeEventListener("click", handlers[i]));
  };
}

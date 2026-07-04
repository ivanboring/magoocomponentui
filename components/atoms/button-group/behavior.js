export default function init(root, props) {
  const activeClasses = (root.dataset.activeClass || "").split(" ").filter(Boolean);
  function setActive(button) {
    root.querySelectorAll(".button-group__item").forEach((btn) => {
      const isActive = btn === button;
      btn.setAttribute("aria-pressed", String(isActive));
      activeClasses.forEach((cls) => btn.classList.toggle(cls, isActive));
    });
    root.dispatchEvent(new CustomEvent("button-group:change", { bubbles: true, detail: { value: button.dataset.value } }));
  }
  function onClick(event) {
    const button = event.target.closest(".button-group__item");
    if (button) setActive(button);
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

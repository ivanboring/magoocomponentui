/**
 * Size selector — single-select available sizes; sold-out are inert. Emits size:change.
 */
export default function init(root, props) {
  function onClick(event) {
    const size = event.target.closest(".size-selector__size");
    if (!size || size.dataset.status === "soldout") return;
    root.querySelectorAll(".size-selector__size").forEach((s) => {
      if (s.dataset.status === "soldout") return;
      const on = s === size;
      s.dataset.status = on ? "selected" : "available";
      s.setAttribute("aria-checked", String(on));
    });
    root.dispatchEvent(new CustomEvent("size:change", { bubbles: true, detail: { size: size.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

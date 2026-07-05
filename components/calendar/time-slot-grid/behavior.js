/**
 * Time slot grid — single-select an available slot; booked are inert. Emits slot:select.
 */
export default function init(root, props) {
  function onClick(event) {
    const slot = event.target.closest(".time-slot-grid__slot");
    if (!slot || slot.dataset.status === "booked") return;
    root.querySelectorAll(".time-slot-grid__slot").forEach((s) => {
      if (s.dataset.status === "booked") return;
      s.dataset.status = s === slot ? "selected" : "available";
    });
    root.dispatchEvent(new CustomEvent("slot:select", { bubbles: true, detail: { time: slot.textContent.trim() } }));
  }
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}

/**
 * Sensor alarm banner — acknowledge handling.
 * Clicking Acknowledge marks the banner (data-acknowledged="true", which dims it via a
 * data-attribute variant), disables the button, and dispatches a bubbling
 * "sensor-alarm:acknowledged" event so a host can record the acknowledgement.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const button = root.querySelector(".sensor-alarm-banner__ack");
  if (!button) return () => {};

  function acknowledge() {
    root.dataset.acknowledged = "true";
    button.disabled = true;
    root.dispatchEvent(new CustomEvent("sensor-alarm:acknowledged", { bubbles: true }));
  }

  button.addEventListener("click", acknowledge);
  return () => button.removeEventListener("click", acknowledge);
}

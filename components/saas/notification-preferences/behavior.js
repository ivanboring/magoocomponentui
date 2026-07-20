/**
 * Notification preferences — toggles each channel switch and emits prefs:change.
 * Every switch carries data-channel and a data-state boolean (mirrored onto its knob). Clicking
 * flips data-state + aria-checked and dispatches a bubbling prefs:change with the row label,
 * channel, and new state. Config comes from the DOM (portable init passes no props object).
 */
export default function init(root) {
  const switches = Array.from(root.querySelectorAll(".notification-preferences__switch"));
  const handlers = [];

  switches.forEach((sw) => {
    const knob = sw.querySelector("span");
    const rowLabel = sw.closest("tr")?.querySelector(".notification-preferences__label");

    function onClick() {
      const on = sw.dataset.state !== "true";
      sw.dataset.state = String(on);
      sw.setAttribute("aria-checked", String(on));
      if (knob) knob.dataset.state = String(on);
      root.dispatchEvent(
        new CustomEvent("prefs:change", {
          bubbles: true,
          detail: {
            label: rowLabel ? rowLabel.textContent.trim() : "",
            channel: sw.dataset.channel,
            on,
          },
        })
      );
    }

    sw.addEventListener("click", onClick);
    handlers.push([sw, onClick]);
  });

  return () => handlers.forEach(([sw, onClick]) => sw.removeEventListener("click", onClick));
}

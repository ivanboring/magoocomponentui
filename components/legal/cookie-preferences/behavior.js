/**
 * Cookie preferences — per-category toggle switches plus Accept all / Reject all / Save.
 *
 * Required categories render as a disabled <span role="switch"> ("Always on") and are never
 * changed here; only non-required categories are interactive buttons (.cookie-preferences__toggle).
 * Save dispatches a "cookies:save" CustomEvent whose detail.preferences maps each category label
 * to its boolean state (required categories included, always true). Config is all in the markup —
 * the portable init passes no props object.
 */
export default function init(root) {
  const toggles = Array.from(root.querySelectorAll(".cookie-preferences__toggle"));
  const accept = root.querySelector(".cookie-preferences__accept");
  const reject = root.querySelector(".cookie-preferences__reject");
  const save = root.querySelector(".cookie-preferences__save");

  const setState = (btn, on) => {
    btn.dataset.state = on ? "true" : "false";
    btn.setAttribute("aria-checked", on ? "true" : "false");
  };

  const toggleHandlers = toggles.map((btn) => {
    const handler = () => setState(btn, btn.dataset.state !== "true");
    btn.addEventListener("click", handler);
    return handler;
  });

  const setAll = (on) => toggles.forEach((btn) => setState(btn, on));
  const onAccept = () => setAll(true);
  const onReject = () => setAll(false);
  accept?.addEventListener("click", onAccept);
  reject?.addEventListener("click", onReject);

  const onSave = () => {
    const preferences = {};
    root.querySelectorAll(".cookie-preferences__switch").forEach((sw) => {
      const key = sw.getAttribute("aria-label");
      if (key) preferences[key] = sw.dataset.state === "true";
    });
    root.dispatchEvent(new CustomEvent("cookies:save", { bubbles: true, detail: { preferences } }));
  };
  save?.addEventListener("click", onSave);

  return () => {
    toggles.forEach((btn, i) => btn.removeEventListener("click", toggleHandlers[i]));
    accept?.removeEventListener("click", onAccept);
    reject?.removeEventListener("click", onReject);
    save?.removeEventListener("click", onSave);
  };
}

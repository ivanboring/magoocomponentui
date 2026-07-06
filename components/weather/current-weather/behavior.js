/**
 * Current-weather behavior — metric/imperial unit switcher (°C/°F).
 *
 * Every temperature is authored once in Celsius on a `[data-celsius]` element, and every
 * convertible stat (wind, visibility) carries a canonical *metric* value on a
 * `.current-weather__stat-value[data-unit]` element (`data-unit="speed"` → km/h⇄mph,
 * `data-unit="distance"` → km⇄mi, `data-metric="<number>"`). Toggling the °C/°F control
 * re-renders temperatures AND those stats between metric (°C) and imperial (°F). Stats
 * without a `data-unit` (humidity, pressure) are left untouched.
 *
 * The starting unit comes from the root's `data-default-unit` ("celsius" | "fahrenheit").
 * Emits (bubbles): "current-weather:unitchange" with detail `{ unit }`.
 */
export default function init(root) {
  const buttons = Array.from(root.querySelectorAll(".current-weather__unit-btn"));
  const temps = Array.from(root.querySelectorAll("[data-celsius]"));
  const stats = Array.from(root.querySelectorAll(".current-weather__stat-value")).filter(
    (el) => el.dataset.unit && el.dataset.metric !== "" && !Number.isNaN(Number(el.dataset.metric)),
  );
  if (!temps.length && !stats.length) return () => {};

  const KM_TO_MI = 0.621371;
  const toFahrenheit = (c) => Math.round((c * 9) / 5 + 32);
  const toImperial = (km) => Math.round(km * KM_TO_MI);
  const IMPERIAL_LABEL = { speed: "mph", distance: "mi" };
  const METRIC_LABEL = { speed: "km/h", distance: "km" };

  let unit = root.dataset.defaultUnit === "fahrenheit" ? "fahrenheit" : "celsius";

  function render(emit) {
    const imperial = unit === "fahrenheit";
    temps.forEach((el) => {
      const c = Number(el.dataset.celsius);
      if (Number.isNaN(c)) return;
      el.textContent = String(imperial ? toFahrenheit(c) : Math.round(c));
    });
    stats.forEach((el) => {
      const km = Number(el.dataset.metric);
      const kind = el.dataset.unit;
      el.textContent = imperial
        ? `${toImperial(km)} ${IMPERIAL_LABEL[kind]}`
        : `${Math.round(km)} ${METRIC_LABEL[kind]}`;
    });
    buttons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.unit === unit));
    });
    if (emit) root.dispatchEvent(new CustomEvent("current-weather:unitchange", { bubbles: true, detail: { unit } }));
  }

  function onClick(event) {
    const next = event.currentTarget.dataset.unit;
    if (next === unit) return;
    unit = next;
    render(true);
  }

  buttons.forEach((btn) => btn.addEventListener("click", onClick));

  // Reconcile the DOM with the requested default unit (matters when it is Fahrenheit,
  // since the static markup renders the metric-authored values). Runs even when the
  // switcher is hidden, so a Fahrenheit-default panel still shows imperial values.
  render(false);

  return () => {
    buttons.forEach((btn) => btn.removeEventListener("click", onClick));
  };
}

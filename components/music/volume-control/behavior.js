/**
 * Volume control — mute toggle stores/restores the prior level; slider emits volume:change.
 */
export default function init(root, props) {
  const mute = root.querySelector(".volume-control__mute");
  const slider = root.querySelector(".volume-control__slider");
  if (!mute || !slider) return () => {};
  let prior = Number(slider.value) || 70;
  function onMute() {
    const muted = root.dataset.muted !== "true";
    root.dataset.muted = String(muted);
    mute.setAttribute("aria-pressed", String(muted));
    if (muted) { prior = Number(slider.value); slider.value = "0"; }
    else { slider.value = String(prior || 70); }
    root.dispatchEvent(new CustomEvent("volume:change", { bubbles: true, detail: { value: Number(slider.value), muted } }));
  }
  function onInput() {
    root.dataset.muted = slider.value === "0" ? "true" : "false";
    mute.setAttribute("aria-pressed", root.dataset.muted);
    root.dispatchEvent(new CustomEvent("volume:change", { bubbles: true, detail: { value: Number(slider.value), muted: slider.value === "0" } }));
  }
  mute.addEventListener("click", onMute);
  slider.addEventListener("input", onInput);
  return () => {
    mute.removeEventListener("click", onMute);
    slider.removeEventListener("input", onInput);
  };
}

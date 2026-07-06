/**
 * Realtime counter — opt-in hover readout for the spark bars.
 *
 * Only active when rendered with `hover_value` (data-hover="true" on the spark). Hovering a
 * bar shows its value (bar.value) in a small tooltip centered over the bar and strengthens
 * that bar's colour (data-active). No-op when hover_value is off or a bar has no value.
 */
export default function init(root, props) {
  const spark = root.querySelector(".realtime-counter__spark");
  if (!spark || spark.dataset.hover !== "true") return () => {};
  const tip = spark.querySelector(".realtime-counter__tip");
  if (!tip) return () => {};
  const bars = [...spark.querySelectorAll(".realtime-counter__bar")];

  function clear() { bars.forEach((b) => { b.dataset.active = "false"; }); }
  function show(bar) {
    const val = bar.dataset.value;
    if (!val) { hide(); return; }
    clear();
    bar.dataset.active = "true";
    tip.textContent = val;
    const sr = spark.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    tip.style.left = br.left - sr.left + br.width / 2 + "px";
    tip.classList.remove("hidden");
  }
  function hide() { clear(); tip.classList.add("hidden"); }
  function onOver(event) {
    const bar = event.target.closest(".realtime-counter__bar");
    if (bar) show(bar);
  }

  spark.addEventListener("mouseover", onOver);
  spark.addEventListener("mouseleave", hide);
  return () => {
    spark.removeEventListener("mouseover", onOver);
    spark.removeEventListener("mouseleave", hide);
  };
}

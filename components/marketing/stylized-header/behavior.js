/**
 * Stylized header — typewriter effect on the "moving part". The rotating words are rendered
 * as a hidden source list (the first one visible for no-JS / screenshots); this reads them,
 * then types and erases each in turn in the rotator. Vanilla, no library.
 */
export default function init(root) {
  const rotator = root.querySelector(".stylized-header__rotator");
  if (!rotator) return () => {};
  const words = [...rotator.querySelectorAll(".stylized-header__word")]
    .map((el) => el.textContent)
    .filter((w) => w && w.length);
  if (!words.length) return () => {};

  // Take over from the pre-rendered source spans: show just the first word as plain text.
  rotator.textContent = words[0];

  // Respect reduced-motion (and a single word) by leaving the first word in place.
  const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || words.length < 2) return () => {};

  const TYPE = 85, ERASE = 40, HOLD = 1600, GAP = 350;
  let wordIdx = 0, charIdx = words[0].length, deleting = true, timer;

  function step() {
    const word = words[wordIdx];
    if (deleting) {
      charIdx -= 1;
      rotator.textContent = word.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        timer = setTimeout(step, GAP);
      } else {
        timer = setTimeout(step, ERASE);
      }
    } else {
      charIdx += 1;
      rotator.textContent = word.slice(0, charIdx);
      if (charIdx >= word.length) {
        deleting = true;
        timer = setTimeout(step, HOLD);
      } else {
        timer = setTimeout(step, TYPE);
      }
    }
  }

  // Hold the first (already-shown) word, then start erasing.
  timer = setTimeout(step, HOLD);
  return () => clearTimeout(timer);
}

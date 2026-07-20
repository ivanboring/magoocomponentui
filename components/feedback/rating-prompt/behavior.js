/**
 * Rating prompt behavior — pick a star score with a hover preview.
 * Each star button carries a 1-based data-index; the inner glyph's data-filled drives the
 * filled/empty look (data-[filled=false]:opacity-25). Hovering previews the fill up to that star,
 * clicking commits it, and a bubbling "rating:submit" CustomEvent { rating } is dispatched.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const stars = Array.from(root.querySelectorAll(".rating-prompt__star"));
  if (!stars.length) return () => {};

  const fillTo = (n) => {
    stars.forEach((btn) => {
      const glyph = btn.querySelector(".rating-prompt__glyph");
      const on = Number(btn.dataset.index) <= n;
      if (glyph) glyph.dataset.filled = on ? "true" : "false";
    });
  };
  const current = () => Number(root.dataset.value) || 0;
  const syncChecked = () => {
    const v = current();
    stars.forEach((btn) => btn.setAttribute("aria-checked", Number(btn.dataset.index) === v ? "true" : "false"));
  };

  const handlers = stars.map((btn) => {
    const index = Number(btn.dataset.index);
    const onEnter = () => fillTo(index);
    const onLeave = () => fillTo(current());
    const onClick = () => {
      root.dataset.value = String(index);
      fillTo(index);
      syncChecked();
      root.dispatchEvent(new CustomEvent("rating:submit", { bubbles: true, detail: { rating: index } }));
    };
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("focus", onEnter);
    btn.addEventListener("blur", onLeave);
    btn.addEventListener("click", onClick);
    return { onEnter, onLeave, onClick };
  });

  return () => {
    stars.forEach((btn, i) => {
      const h = handlers[i];
      btn.removeEventListener("mouseenter", h.onEnter);
      btn.removeEventListener("mouseleave", h.onLeave);
      btn.removeEventListener("focus", h.onEnter);
      btn.removeEventListener("blur", h.onLeave);
      btn.removeEventListener("click", h.onClick);
    });
  };
}

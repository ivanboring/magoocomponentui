/**
 * Star rating input behavior — click, hover preview, and arrow-key navigation.
 * Each star button carries a 1-based data-index; the inner glyph's data-filled drives the
 * filled/empty look. Clicking or keying a star sets the root's data-value, fills up to it, keeps
 * roving focus and aria-checked in sync, and dispatches a bubbling "rating:change" { value }.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const stars = Array.from(root.querySelectorAll(".star-rating-input__star"));
  if (!stars.length) return () => {};
  const max = stars.length;

  const value = () => Number(root.dataset.value) || 0;
  const fillTo = (n) => {
    stars.forEach((btn) => {
      const glyph = btn.querySelector(".star-rating-input__glyph");
      if (glyph) glyph.dataset.filled = Number(btn.dataset.index) <= n ? "true" : "false";
    });
  };
  const syncTabindex = () => {
    const v = value();
    stars.forEach((btn) => {
      const i = Number(btn.dataset.index);
      btn.setAttribute("aria-checked", i === v ? "true" : "false");
      // Roving tabindex: the selected star (or the first when unrated) takes focus.
      btn.tabIndex = i === (v || 1) ? 0 : -1;
    });
  };
  const set = (n) => {
    const clamped = Math.max(1, Math.min(max, n));
    root.dataset.value = String(clamped);
    fillTo(clamped);
    syncTabindex();
    root.dispatchEvent(new CustomEvent("rating:change", { bubbles: true, detail: { value: clamped } }));
    const target = stars.find((b) => Number(b.dataset.index) === clamped);
    if (target) target.focus();
  };

  const onKey = (event) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (dir) {
      event.preventDefault();
      set((value() || 0) + dir);
    } else if (event.key === "Home") {
      event.preventDefault();
      set(1);
    } else if (event.key === "End") {
      event.preventDefault();
      set(max);
    }
  };

  const clickHandlers = stars.map((btn) => {
    const index = Number(btn.dataset.index);
    const onEnter = () => fillTo(index);
    const onLeave = () => fillTo(value());
    const onClick = () => set(index);
    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("click", onClick);
    return { onEnter, onLeave, onClick };
  });
  root.addEventListener("keydown", onKey);
  syncTabindex();

  return () => {
    stars.forEach((btn, i) => {
      const h = clickHandlers[i];
      btn.removeEventListener("mouseenter", h.onEnter);
      btn.removeEventListener("mouseleave", h.onLeave);
      btn.removeEventListener("click", h.onClick);
    });
    root.removeEventListener("keydown", onKey);
  };
}

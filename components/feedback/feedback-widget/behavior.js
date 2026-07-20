/**
 * Feedback widget behavior — open/close the floating panel and send feedback.
 * The panel reveal is pure CSS driven by the root's data-open attribute (group-data-[open=true]),
 * so the open state renders with no JavaScript. This wires interaction: the launcher toggles
 * data-open, Escape and an outside click close it, the star row sets a rating, and Send dispatches a
 * bubbling "feedback:send" CustomEvent with { rating, message } then closes.
 * Config comes from data-* attributes (portable init passes no props object).
 */
export default function init(root) {
  const launcher = root.querySelector(".feedback-widget__launcher");
  const panel = root.querySelector(".feedback-widget__panel");
  const send = root.querySelector(".feedback-widget__send");
  const message = root.querySelector(".feedback-widget__message");
  const stars = Array.from(root.querySelectorAll(".feedback-widget__star"));
  let rating = 0;

  const isOpen = () => root.dataset.open === "true";
  const setOpen = (open) => {
    root.dataset.open = open ? "true" : "false";
    if (launcher) launcher.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const toggle = () => setOpen(!isOpen());

  const fillTo = (n) => {
    stars.forEach((btn) => {
      const glyph = btn.querySelector(".feedback-widget__glyph");
      const on = Number(btn.dataset.index) <= n;
      if (glyph) glyph.dataset.filled = on ? "true" : "false";
      btn.setAttribute("aria-checked", Number(btn.dataset.index) === n ? "true" : "false");
    });
  };

  const onLauncher = (event) => {
    event.stopPropagation();
    toggle();
  };
  const onKey = (event) => {
    if (event.key === "Escape" && isOpen()) setOpen(false);
  };
  const onOutside = (event) => {
    if (isOpen() && !root.contains(event.target)) setOpen(false);
  };
  const onSend = () => {
    root.dispatchEvent(
      new CustomEvent("feedback:send", {
        bubbles: true,
        detail: { rating, message: message ? message.value : "" },
      })
    );
    setOpen(false);
  };
  const starHandlers = stars.map((btn) => {
    const h = () => {
      rating = Number(btn.dataset.index);
      fillTo(rating);
    };
    btn.addEventListener("click", h);
    return h;
  });

  launcher?.addEventListener("click", onLauncher);
  send?.addEventListener("click", onSend);
  root.addEventListener("keydown", onKey);
  document.addEventListener("click", onOutside);

  return () => {
    launcher?.removeEventListener("click", onLauncher);
    send?.removeEventListener("click", onSend);
    root.removeEventListener("keydown", onKey);
    document.removeEventListener("click", onOutside);
    stars.forEach((btn, i) => btn.removeEventListener("click", starHandlers[i]));
  };
}

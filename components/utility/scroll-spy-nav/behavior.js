/**
 * Scroll-spy nav — highlights the link whose section is currently in view.
 *
 * Each link points at an on-page anchor (#section-id). An IntersectionObserver over the referenced
 * sections marks the link whose section is in view (data-active + aria-current); clicking a link
 * activates it immediately. If none of the referenced sections exist (e.g. an isolated preview),
 * the observer is skipped and the example's static active state is left untouched. Config comes
 * from the DOM; the portable init passes no props object.
 */
export default function init(root) {
  const links = Array.from(root.querySelectorAll(".scroll-spy-nav__link"));
  if (!links.length) return () => {};

  function setActive(href) {
    links.forEach((link) => {
      const on = link.getAttribute("href") === href;
      link.dataset.active = String(on);
      link.setAttribute("aria-current", String(on));
    });
  }

  function onClick(event) {
    const link = event.target.closest(".scroll-spy-nav__link");
    if (link) setActive(link.getAttribute("href"));
  }
  root.addEventListener("click", onClick);

  const pairs = links
    .map((link) => {
      const id = (link.getAttribute("href") || "").replace(/^#/, "");
      const target = id ? document.getElementById(id) : null;
      return target ? { href: "#" + id, target } : null;
    })
    .filter(Boolean);

  let observer = null;
  if (pairs.length && "IntersectionObserver" in window) {
    const byTarget = new Map(pairs.map((p) => [p.target, p.href]));
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(byTarget.get(visible.target));
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    pairs.forEach((p) => observer.observe(p.target));
  }

  return () => {
    root.removeEventListener("click", onClick);
    observer?.disconnect();
  };
}

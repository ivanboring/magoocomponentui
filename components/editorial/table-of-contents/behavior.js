/**
 * Table of contents — highlights the item whose section is in view using an
 * IntersectionObserver on the referenced headings. Falls back to click-to-activate.
 */
export default function init(root, props) {
  const links = Array.from(root.querySelectorAll(".table-of-contents__item"));
  if (!links.length) return () => {};

  function setActive(href) {
    links.forEach((l) => {
      const on = l.getAttribute("href") === href;
      l.dataset.active = String(on);
      l.setAttribute("aria-current", String(on));
    });
  }
  function onClick(event) {
    const link = event.target.closest(".table-of-contents__item");
    if (link) setActive(link.getAttribute("href"));
  }
  root.addEventListener("click", onClick);

  const targets = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  let observer = null;
  if (targets.length && "IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive("#" + visible.target.id);
    }, { rootMargin: "0px 0px -70% 0px" });
    targets.forEach((t) => observer.observe(t));
  }
  return () => {
    root.removeEventListener("click", onClick);
    observer?.disconnect();
  };
}

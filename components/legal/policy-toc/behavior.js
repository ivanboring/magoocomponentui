/**
 * Policy table of contents — optional scroll-spy.
 *
 * Highlights the section whose heading is in view using an IntersectionObserver on the elements the
 * links point at (via their href anchor ids). If none of the hrefs resolve to a real element on the
 * page (e.g. the TOC is rendered on its own), it stays a no-op and the authored active state holds.
 * Clicking a link also activates it immediately. Config is all in the markup; no props object.
 */
export default function init(root) {
  const links = Array.from(root.querySelectorAll(".policy-toc__item"));
  if (!links.length) return () => {};

  const setActive = (href) => {
    links.forEach((link) => {
      const on = link.getAttribute("href") === href;
      link.dataset.active = String(on);
      link.setAttribute("aria-current", String(on));
    });
  };

  const onClick = (event) => {
    const link = event.target.closest(".policy-toc__item");
    if (link) setActive(link.getAttribute("href"));
  };
  root.addEventListener("click", onClick);

  const targets = links
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean);

  let observer = null;
  if (targets.length && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive("#" + visible.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
  }

  return () => {
    root.removeEventListener("click", onClick);
    observer?.disconnect();
  };
}

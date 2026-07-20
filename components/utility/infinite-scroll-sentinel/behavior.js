/**
 * Infinite-scroll sentinel — dispatches a "loadmore" event when it scrolls into view.
 *
 * An IntersectionObserver watches the sentinel; when it enters the viewport and the list is not
 * marked done (data-done="true"), it dispatches a bubbling "loadmore" CustomEvent for a parent to
 * fetch the next page. Set data-done="true" (from the done prop, updated by the parent when the
 * list is exhausted) to stop firing. Config comes from the DOM; the portable init passes no props.
 */
export default function init(root) {
  if (!("IntersectionObserver" in window)) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && root.dataset.done !== "true") {
          root.dispatchEvent(new CustomEvent("loadmore", { bubbles: true }));
        }
      }
    },
    { rootMargin: "200px 0px" }
  );
  observer.observe(root);

  return () => observer.disconnect();
}

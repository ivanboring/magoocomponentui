/**
 * Video premiere countdown — a wrapper that counts down to a start time over a background
 * image, then reveals a slotted video (live or on-demand) at (start − reveal) seconds.
 *
 * Hiding the URL until premiere: the source can be withheld from the markup entirely and
 * supplied over JS so it only enters the DOM at reveal. Two ways to provide it:
 *   el.setPremiereSource("https://…")            // method on the root element
 *   el.dispatchEvent(new CustomEvent("premiere:set-source", { detail: { url }}))
 * At reveal the URL is set on the first <video>/<iframe>/<source> inside the video slot.
 *
 * Config comes from data-* (portable init passes no props): data-start (ISO), data-reveal
 * (seconds), data-now (optional server ISO to seed the clock and avoid client-clock skew).
 */
export default function init(root, props) {
  const overlay = root.querySelector(".video-premiere__overlay");
  const videoWrap = root.querySelector(".video-premiere__video");
  const days = root.querySelector(".video-premiere__days");
  const hours = root.querySelector(".video-premiere__hours");
  const minutes = root.querySelector(".video-premiere__minutes");
  const seconds = root.querySelector(".video-premiere__seconds");
  const compact = root.querySelector(".video-premiere__compact-value");
  const start = new Date(root.dataset.start).getTime();
  const reveal = (Number(root.dataset.reveal) || 0) * 1000;
  if (Number.isNaN(start)) return () => {};

  // Seed "now" from the server timestamp when given, then advance with a monotonic offset.
  const serverNow = root.dataset.now ? new Date(root.dataset.now).getTime() : null;
  const baseClient = performance.now();
  const now = () => (serverNow != null ? serverNow + (performance.now() - baseClient) : Date.now());

  let sourceUrl = null;
  let revealed = false;
  const pad = (n) => String(n).padStart(2, "0");

  function applySource() {
    if (!sourceUrl || !videoWrap) return;
    const media = videoWrap.querySelector("video, iframe, source");
    if (!media) return;
    media.setAttribute("src", sourceUrl);
    if (media.tagName === "VIDEO") { media.load?.(); }
  }
  function setSource(url) {
    sourceUrl = url;
    if (revealed) applySource();
  }
  // Public API for supplying the URL late (keeps it out of the static markup).
  root.setPremiereSource = setSource;
  function onSetSource(event) { if (event.detail && event.detail.url) setSource(event.detail.url); }
  root.addEventListener("premiere:set-source", onSetSource);

  function revealVideo() {
    if (revealed) return;
    revealed = true;
    applySource();
    videoWrap?.classList.remove("hidden");
    overlay?.classList.add("hidden");
    root.dispatchEvent(new CustomEvent("premiere:live", { bubbles: true }));
  }

  function tick() {
    const remaining = start - reveal - now();
    if (remaining <= 0) { revealVideo(); clearInterval(timer); return; }
    const s = Math.floor(remaining / 1000);
    if (days) days.textContent = pad(Math.floor(s / 86400));
    if (hours) hours.textContent = pad(Math.floor((s % 86400) / 3600));
    if (minutes) minutes.textContent = pad(Math.floor((s % 3600) / 60));
    if (seconds) seconds.textContent = pad(s % 60);
    if (compact) {
      const totalHours = Math.floor(s / 3600);
      compact.textContent = `${pad(totalHours)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    }
  }

  tick();
  const timer = setInterval(tick, 1000);
  return () => {
    clearInterval(timer);
    root.removeEventListener("premiere:set-source", onSetSource);
    delete root.setPremiereSource;
  };
}

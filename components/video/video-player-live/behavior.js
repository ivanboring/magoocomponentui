/**
 * Live player — plays an HLS (.m3u8) stream and toggles play/pause and mute.
 *
 * HLS delivery depends on hls.js (https://github.com/video-dev/hls.js/). The library is
 * loaded lazily and only when a stream is actually present: browsers with native HLS
 * (Safari/iOS) use it directly; everywhere else hls.js is pulled from a CDN as an ES
 * module (or reused from a preloaded global `window.Hls`) and attached to the <video>.
 * With no stream, the controls still toggle their visual state so the skeleton previews.
 * No scrubber: live streams play at the live edge.
 */
const HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.mjs";
const HLS_RE = /\.m3u8(\?|#|$)/i;

async function loadHls() {
  if (typeof window !== "undefined" && window.Hls) return window.Hls;
  try {
    const mod = await import(/* @vite-ignore */ HLS_CDN);
    return mod.default || (typeof window !== "undefined" ? window.Hls : null);
  } catch (_) {
    return null; /* offline / blocked CDN — fall back to native */
  }
}

export default function init(root, props) {
  const video = root.querySelector(".video-player-live__video");
  const play = root.querySelector(".video-player-live__play");
  const iconPlay = root.querySelector(".video-player-live__icon-play");
  const iconPause = root.querySelector(".video-player-live__icon-pause");
  const mute = root.querySelector(".video-player-live__mute");
  if (!play) return () => {};
  const syncId = root.dataset.syncId || "";
  let hls = null;

  function setPlaying(p) {
    play.setAttribute("aria-pressed", String(p));
    play.setAttribute("aria-label", p ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", p);
    iconPause?.classList.toggle("hidden", !p);
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:state", { detail: { id: syncId, playing: p } }));
  }
  function onTime() {
    if (!syncId || !video || !video.duration) return;
    document.dispatchEvent(new CustomEvent("mediasync:time", {
      detail: { id: syncId, currentTime: video.currentTime, duration: video.duration, percent: (video.currentTime / video.duration) * 100 },
    }));
  }
  function onPlay() {
    if (video && video.src) { video.paused ? video.play() : video.pause(); }
    else setPlaying(play.getAttribute("aria-pressed") !== "true");
  }
  function onMute() {
    const next = mute.getAttribute("aria-pressed") !== "true";
    mute.setAttribute("aria-pressed", String(next));
    mute.setAttribute("aria-label", next ? "Unmute" : "Mute");
    if (video) video.muted = next;
  }

  // Attach the stream. `data-src` (not `src`) holds the URL so the browser never tries to
  // load an .m3u8 natively where it can't — hls.js decides.
  async function setupStream() {
    if (!video) return;
    const src = video.dataset.src || "";
    if (!src) return;
    if (!HLS_RE.test(src)) { video.src = src; return; }            // progressive stream — native
    if (video.canPlayType("application/vnd.apple.mpegurl")) {       // native HLS (Safari/iOS)
      video.src = src;
      return;
    }
    const Hls = await loadHls();
    if (Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      // If the viewer already hit play while hls.js was loading, start now.
      if (play.getAttribute("aria-pressed") === "true") video.play?.();
    } else {
      video.src = src;                                             // best-effort fallback
    }
  }

  play.addEventListener("click", onPlay);
  mute?.addEventListener("click", onMute);
  video?.addEventListener("play", () => setPlaying(true));
  video?.addEventListener("pause", () => setPlaying(false));
  video?.addEventListener("timeupdate", onTime);
  setupStream();
  return () => {
    play.removeEventListener("click", onPlay);
    mute?.removeEventListener("click", onMute);
    video?.removeEventListener("timeupdate", onTime);
    if (hls) { hls.destroy(); hls = null; }
  };
}

/**
 * YouTube player — plays a YouTube video through the IFrame Player API behind a styled,
 * skeleton control bar (play/pause, mute, cycle speed, seek scrubber, fullscreen), and
 * broadcasts its position on the shared mediasync bus so a video-transcript / video-chapters
 * (any component carrying the same sync_id) stays in sync. controls=0 hides YouTube's own
 * chrome so the custom bar is the only UI.
 *
 * The IFrame API (https://www.youtube.com/iframe_api) is a classic script, not an ES module,
 * so it is injected once and awaited by polling for window.YT.Player (multiple players on a
 * page share the one script). With no video id — or if the API is blocked/offline — the
 * poster and controls still render (controls toggle their visual state only) so the skeleton
 * previews and the screenshot pipeline, which never runs behavior.js, shows the poster frame.
 */
const YT_API = "https://www.youtube.com/iframe_api";
const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

// Accept a bare 11-char id or any watch/share/embed/shorts URL and reduce it to the id.
function parseVideoId(raw) {
  if (!raw) return "";
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const m = raw.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : raw;
}

function loadYT() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    if (!document.querySelector("script[data-yt-api]")) {
      const s = document.createElement("script");
      s.src = YT_API;
      s.async = true;
      s.dataset.ytApi = "";
      document.head.appendChild(s);
    }
    // Poll rather than rely on the single global onYouTubeIframeAPIReady callback, so any
    // number of players (mounting before or after the API loads) each resolve correctly.
    const iv = setInterval(() => {
      if (window.YT && window.YT.Player) { clearInterval(iv); resolve(window.YT); }
    }, 100);
  });
}

function fmt(t) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ":" + String(s).padStart(2, "0");
}

export default function init(root, props) {
  const mount = root.querySelector(".video-player-youtube__mount");
  const play = root.querySelector(".video-player-youtube__play");
  const iconPlay = root.querySelector(".video-player-youtube__icon-play");
  const iconPause = root.querySelector(".video-player-youtube__icon-pause");
  const mute = root.querySelector(".video-player-youtube__mute");
  const speed = root.querySelector(".video-player-youtube__speed");
  const fs = root.querySelector(".video-player-youtube__fullscreen");
  const scrubber = root.querySelector(".video-player-youtube__scrubber");
  const progress = root.querySelector(".video-player-youtube__progress");
  const timeLabel = root.querySelector(".video-player-youtube__time");
  if (!play || !scrubber || !progress) return () => {};

  const syncId = root.dataset.syncId || "";
  const videoId = parseVideoId(root.dataset.videoId || "");
  let player = null;
  let speedIdx = 0;
  let poll = null;
  let destroyed = false;

  function setPlaying(playing) {
    play.setAttribute("aria-pressed", String(playing));
    play.setAttribute("aria-label", playing ? "Pause" : "Play");
    iconPlay?.classList.toggle("hidden", playing);
    iconPause?.classList.toggle("hidden", !playing);
    if (syncId) document.dispatchEvent(new CustomEvent("mediasync:state", { detail: { id: syncId, playing } }));
  }
  function renderPct(pct) {
    const clamped = Math.min(100, Math.max(0, pct));
    progress.style.width = clamped + "%";
    scrubber.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }
  // Tell satellites (transcript/chapters/scrubber) the current position.
  function broadcast(currentTime, duration) {
    if (!syncId) return;
    const percent = duration ? (currentTime / duration) * 100 : 0;
    document.dispatchEvent(new CustomEvent("mediasync:time", {
      detail: { id: syncId, currentTime, duration, percent },
    }));
  }
  // Poll the YT player while it plays → drive the scrubber, time label, and the sync bus.
  function tick() {
    if (!player || !player.getDuration) return;
    const d = player.getDuration();
    const t = player.getCurrentTime();
    if (!d) return;
    renderPct((t / d) * 100);
    if (timeLabel) timeLabel.textContent = fmt(t) + " / " + fmt(d);
    broadcast(t, d);
  }
  function startPoll() { stopPoll(); poll = setInterval(tick, 250); }
  function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }

  // Controls drive the YT API; before the player exists they only toggle visual state.
  function onPlay() {
    if (!player) { setPlaying(play.getAttribute("aria-pressed") !== "true"); return; }
    if (player.getPlayerState?.() === 1) player.pauseVideo?.();
    else player.playVideo?.();
  }
  function onMute() {
    const next = mute.getAttribute("aria-pressed") !== "true";
    mute.setAttribute("aria-pressed", String(next));
    mute.setAttribute("aria-label", next ? "Unmute" : "Mute");
    if (player) { next ? player.mute?.() : player.unMute?.(); }
  }
  function onSpeed() {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    const rate = SPEEDS[speedIdx];
    speed.textContent = rate + "×";
    player?.setPlaybackRate?.(rate);
  }
  function onFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.requestFullscreen?.();
  }
  function seekToPct(pct) {
    renderPct(pct);
    const d = player?.getDuration?.();
    if (d) { const secs = (pct / 100) * d; player.seekTo(secs, true); broadcast(secs, d); }
  }
  function onScrub(event) {
    const rect = scrubber.getBoundingClientRect();
    seekToPct(Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)));
  }
  function onKey(event) {
    const now = Number(scrubber.getAttribute("aria-valuenow")) || 0;
    if (event.key === "ArrowRight") seekToPct(Math.min(100, now + 5));
    else if (event.key === "ArrowLeft") seekToPct(Math.max(0, now - 5));
  }
  // A satellite asked us to seek.
  function onSyncSeek(event) {
    const d = event.detail;
    if (!syncId || !d || d.id !== syncId) return;
    if (typeof d.seconds === "number") {
      player?.seekTo?.(d.seconds, true);
      const dur = player?.getDuration?.();
      if (dur) renderPct((d.seconds / dur) * 100);
    } else if (typeof d.percent === "number") {
      seekToPct(d.percent);
    }
  }

  play.addEventListener("click", onPlay);
  mute?.addEventListener("click", onMute);
  speed?.addEventListener("click", onSpeed);
  fs?.addEventListener("click", onFullscreen);
  scrubber.addEventListener("click", onScrub);
  scrubber.addEventListener("keydown", onKey);
  if (syncId) document.addEventListener("mediasync:seek", onSyncSeek);

  // Boot the embed only when a video id is present.
  if (videoId && mount) {
    loadYT().then((YT) => {
      if (destroyed || !YT) return;
      player = new YT.Player(mount, {
        videoId,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, disablekb: 1 },
        events: {
          onReady: () => {
            // YT.Player replaced the mount node with an <iframe>; make it fill the frame.
            const iframe = player.getIframe?.();
            iframe?.classList.add("absolute", "inset-0", "h-full", "w-full");
            const d = player.getDuration?.();
            if (timeLabel && d) timeLabel.textContent = fmt(0) + " / " + fmt(d);
          },
          onStateChange: (e) => {
            // YT.PlayerState: 1 playing, 2 paused, 0 ended.
            if (e.data === 1) { setPlaying(true); startPoll(); }
            else {
              setPlaying(false);
              stopPoll();
              if (e.data === 0) { renderPct(100); tick(); }
              else tick();
            }
          },
        },
      });
    });
  }

  return () => {
    destroyed = true;
    stopPoll();
    play.removeEventListener("click", onPlay);
    mute?.removeEventListener("click", onMute);
    speed?.removeEventListener("click", onSpeed);
    fs?.removeEventListener("click", onFullscreen);
    scrubber.removeEventListener("click", onScrub);
    scrubber.removeEventListener("keydown", onKey);
    if (syncId) document.removeEventListener("mediasync:seek", onSyncSeek);
    try { player?.destroy?.(); } catch (_) { /* iframe already gone */ }
    player = null;
  };
}

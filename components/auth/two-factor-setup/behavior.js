/**
 * Two-factor setup — renders the QR as a real, updatable image and auto-advances the code
 * cells.
 *
 * The QR is generated from the container's `data-otpauth` URI with qrcode
 * (https://github.com/soldair/node-qrcode), loaded lazily from a CDN as an ES module (or a
 * preloaded global `window.QRCode`). It re-renders whenever `data-otpauth` changes (a host
 * can rotate the secret), and the manual secret text is derived from the URI so both stay in
 * sync. Emits 2fa:complete when all cells are filled.
 */
const QR_CDN = "https://cdn.jsdelivr.net/npm/qrcode@1/+esm";

async function loadQR() {
  if (typeof window !== "undefined" && window.QRCode) return window.QRCode;
  try {
    const mod = await import(/* @vite-ignore */ QR_CDN);
    return mod.default || mod;
  } catch (_) {
    return null; /* offline / blocked CDN — leave the placeholder */
  }
}

function secretFromOtpauth(uri) {
  try { return new URL(uri).searchParams.get("secret") || ""; } catch (_) { return ""; }
}

export default function init(root, props) {
  // --- QR image + manual secret (real, updatable) ---
  const qr = root.querySelector(".two-factor-setup__qr");
  const qrImg = root.querySelector(".two-factor-setup__qr-img");
  const secretEl = root.querySelector(".two-factor-setup__secret-value");
  let observer = null;

  async function renderQR() {
    if (!qr || !qrImg) return;
    const payload = qr.dataset.otpauth || "";
    if (!payload) { qrImg.removeAttribute("src"); return; }
    // Keep the manual code in sync with what the QR encodes.
    if (secretEl) {
      const s = secretFromOtpauth(payload);
      if (s) secretEl.textContent = s.replace(/(.{4})/g, "$1 ").trim();
    }
    const QR = await loadQR();
    if (!QR) return;
    try {
      qrImg.src = await QR.toDataURL(payload, { margin: 0, width: 320, errorCorrectionLevel: "M" });
    } catch (_) { /* leave the placeholder */ }
  }
  if (qr) {
    renderQR();
    // Re-render if the host updates the otpauth URI.
    observer = new MutationObserver(renderQR);
    observer.observe(qr, { attributes: true, attributeFilter: ["data-otpauth"] });
  }

  // --- code cells: auto-advance + emit on complete ---
  const cells = Array.from(root.querySelectorAll(".two-factor-setup__cell"));
  function onInput(event) {
    const i = cells.indexOf(event.target);
    event.target.value = event.target.value.replace(/\D/g, "").slice(-1);
    if (event.target.value && i < cells.length - 1) cells[i + 1].focus();
    const code = cells.map((c) => c.value).join("");
    if (code.length === cells.length) root.dispatchEvent(new CustomEvent("2fa:complete", { bubbles: true, detail: { code } }));
  }
  function onKeydown(event) {
    const i = cells.indexOf(event.target);
    if (event.key === "Backspace" && !event.target.value && i > 0) cells[i - 1].focus();
  }
  cells.forEach((c) => { c.addEventListener("input", onInput); c.addEventListener("keydown", onKeydown); });

  return () => {
    observer?.disconnect();
    cells.forEach((c) => { c.removeEventListener("input", onInput); c.removeEventListener("keydown", onKeydown); });
  };
}

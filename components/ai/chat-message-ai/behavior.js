/**
 * Chat message (assistant) behavior — copy the reply text and emit action events.
 * Config-free: it reads the rendered message text from the content element and wires the
 * action-row buttons. Copy swaps the button glyph to a check mark and restores it after a beat.
 */
const CHECK = '<svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10l4 4 8-8"/></svg>';

export default function init(root) {
  const copyBtn = root.querySelector(".chat-message-ai__copy");
  const content = root.querySelector(".chat-message-ai__content");
  const regenBtn = root.querySelector(".chat-message-ai__regenerate");
  let timer;

  async function onCopy() {
    const text = content ? content.textContent.trim() : "";
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = CHECK;
    copyBtn.setAttribute("aria-label", "Copied!");
    clearTimeout(timer);
    timer = setTimeout(() => {
      copyBtn.innerHTML = original;
      copyBtn.setAttribute("aria-label", "Copy message");
    }, 1500);
  }

  function onRegen() {
    root.dispatchEvent(new CustomEvent("chat:regenerate", { bubbles: true }));
  }

  copyBtn?.addEventListener("click", onCopy);
  regenBtn?.addEventListener("click", onRegen);

  return () => {
    copyBtn?.removeEventListener("click", onCopy);
    regenBtn?.removeEventListener("click", onRegen);
    clearTimeout(timer);
  };
}

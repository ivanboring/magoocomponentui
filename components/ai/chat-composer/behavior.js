/**
 * Chat composer behavior — auto-growing textarea, empty-guarded send, and Enter-to-send.
 * Config comes from data-* on the form (data-max-height caps the textarea growth in px).
 * Sending dispatches a bubbling "chat:send" CustomEvent with { value } and clears the field.
 */
export default function init(root) {
  const input = root.querySelector(".chat-composer__input");
  const sendBtn = root.querySelector(".chat-composer__send");
  const attachBtn = root.querySelector(".chat-composer__attach");
  if (!input) return () => {};

  const maxHeight = parseInt(root.dataset.maxHeight, 10) || 200;

  function grow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, maxHeight) + "px";
  }
  function refresh() {
    if (sendBtn) sendBtn.disabled = input.value.trim() === "";
  }
  function onInput() {
    grow();
    refresh();
  }
  function send() {
    const value = input.value.trim();
    if (!value) return;
    root.dispatchEvent(new CustomEvent("chat:send", { bubbles: true, detail: { value } }));
    input.value = "";
    grow();
    refresh();
    input.focus();
  }
  function onSubmit(event) {
    event.preventDefault();
    send();
  }
  function onKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }
  function onAttach() {
    root.dispatchEvent(new CustomEvent("chat:attach", { bubbles: true }));
  }

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeydown);
  root.addEventListener("submit", onSubmit);
  attachBtn?.addEventListener("click", onAttach);
  refresh();
  grow();

  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("keydown", onKeydown);
    root.removeEventListener("submit", onSubmit);
    attachBtn?.removeEventListener("click", onAttach);
  };
}

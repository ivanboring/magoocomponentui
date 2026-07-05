/**
 * Search bar — shows the clear button while there's a value; clearing empties the input,
 * refocuses it, and emits search:clear. Typing emits search:input (debounced).
 */
export default function init(root, props) {
  const input = root.querySelector(".search-bar__input");
  const clear = root.querySelector(".search-bar__clear");
  if (!input) return () => {};
  let timer = null;

  function syncClear() { if (clear) clear.dataset.visible = input.value ? "true" : "false"; }
  function onInput() {
    syncClear();
    clearTimeout(timer);
    timer = setTimeout(() => {
      root.dispatchEvent(new CustomEvent("search:input", { bubbles: true, detail: { value: input.value } }));
    }, 200);
  }
  function onClear() {
    input.value = "";
    syncClear();
    input.focus();
    root.dispatchEvent(new CustomEvent("search:clear", { bubbles: true }));
  }
  syncClear();
  input.addEventListener("input", onInput);
  clear?.addEventListener("click", onClear);
  return () => {
    clearTimeout(timer);
    input.removeEventListener("input", onInput);
    clear?.removeEventListener("click", onClear);
  };
}

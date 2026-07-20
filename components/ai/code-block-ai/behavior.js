/**
 * Code block behavior — copy the code to the clipboard and (optionally) emit a run request.
 * Copy reads the rendered text from the code element and briefly swaps the button label to
 * "Copied!". Run, when present, dispatches a bubbling "code:run" CustomEvent with the code text.
 */
export default function init(root) {
  const copyBtn = root.querySelector(".code-block-ai__copy");
  const label = root.querySelector(".code-block-ai__copy-label");
  const codeEl = root.querySelector(".code-block-ai__code");
  const runBtn = root.querySelector(".code-block-ai__run");
  let timer;

  async function onCopy() {
    const text = codeEl ? codeEl.textContent : "";
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    if (label) {
      const original = label.textContent;
      label.textContent = "Copied!";
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = original;
      }, 1500);
    }
  }

  function onRun() {
    root.dispatchEvent(new CustomEvent("code:run", { bubbles: true, detail: { code: codeEl ? codeEl.textContent : "" } }));
  }

  copyBtn?.addEventListener("click", onCopy);
  runBtn?.addEventListener("click", onRun);

  return () => {
    copyBtn?.removeEventListener("click", onCopy);
    runBtn?.removeEventListener("click", onRun);
    clearTimeout(timer);
  };
}

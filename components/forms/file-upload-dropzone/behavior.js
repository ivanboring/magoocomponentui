/**
 * File upload dropzone — accepts dropped or browsed files, lists them with a remove
 * control, and emits files:added. Highlights on dragover.
 */
export default function init(root, props) {
  const zone = root.querySelector(".file-upload-dropzone__zone");
  const input = root.querySelector(".file-upload-dropzone__input");
  const files = root.querySelector(".file-upload-dropzone__files");
  if (!zone || !input || !files) return () => {};

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  function addFiles(list) {
    for (const file of list) {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 py-2 text-sm text-on-surface";
      li.innerHTML = `<span class="min-w-0 flex-1 truncate">${file.name}</span><span class="shrink-0 text-xs text-on-surface-muted">${fmtSize(file.size)}</span><button type="button" class="file-upload-dropzone__remove shrink-0 text-on-surface-muted hover:text-danger" aria-label="Remove file">✕</button>`;
      files.appendChild(li);
    }
    root.dispatchEvent(new CustomEvent("files:added", { bubbles: true, detail: { count: list.length } }));
  }
  function onChange() { if (input.files?.length) addFiles(input.files); }
  function onDragOver(event) { event.preventDefault(); zone.dataset.dragover = "true"; }
  function onDragLeave() { zone.dataset.dragover = "false"; }
  function onDrop(event) { event.preventDefault(); zone.dataset.dragover = "false"; if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files); }
  function onRemove(event) { const btn = event.target.closest(".file-upload-dropzone__remove"); if (btn) btn.closest("li").remove(); }

  input.addEventListener("change", onChange);
  zone.addEventListener("dragover", onDragOver);
  zone.addEventListener("dragleave", onDragLeave);
  zone.addEventListener("drop", onDrop);
  files.addEventListener("click", onRemove);
  return () => {
    input.removeEventListener("change", onChange);
    zone.removeEventListener("dragover", onDragOver);
    zone.removeEventListener("dragleave", onDragLeave);
    zone.removeEventListener("drop", onDrop);
    files.removeEventListener("click", onRemove);
  };
}

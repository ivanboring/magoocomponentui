/**
 * Bug report form behavior — wire the file-attach affordance and submit.
 * The "Browse files" button opens the hidden native file input; chosen files are listed by name
 * inside the dropzone and files dropped onto the dropzone are added too. Submitting is intercepted
 * (preventDefault) and re-broadcast as a bubbling "bug:report" CustomEvent with
 * { title, severity, description, files } (files is an array of File objects) for the host to send.
 * Returns a cleanup that removes every listener.
 */
export default function init(root) {
  const browse = root.querySelector(".bug-report-form__browse");
  const fileInput = root.querySelector(".bug-report-form__file");
  const fileList = root.querySelector(".bug-report-form__filelist");
  const dropzone = root.querySelector(".bug-report-form__dropzone");
  const titleEl = root.querySelector(".bug-report-form__title");
  const severityEl = root.querySelector(".bug-report-form__severity");
  const descriptionEl = root.querySelector(".bug-report-form__description");

  let files = [];

  function render() {
    if (!fileList) return;
    fileList.textContent = "";
    files.forEach((file) => {
      const li = document.createElement("li");
      li.className = "truncate";
      li.textContent = file.name;
      fileList.appendChild(li);
    });
  }

  const onBrowse = () => fileInput && fileInput.click();
  const onFileChange = () => {
    if (fileInput) files = files.concat(Array.from(fileInput.files || []));
    render();
  };
  const onDragOver = (event) => {
    event.preventDefault();
    if (dropzone) dropzone.dataset.dragging = "true";
  };
  const onDragLeave = () => {
    if (dropzone) dropzone.dataset.dragging = "false";
  };
  const onDrop = (event) => {
    event.preventDefault();
    if (dropzone) dropzone.dataset.dragging = "false";
    if (event.dataTransfer) files = files.concat(Array.from(event.dataTransfer.files || []));
    render();
  };
  function onSubmit(event) {
    event.preventDefault();
    root.dispatchEvent(
      new CustomEvent("bug:report", {
        bubbles: true,
        detail: {
          title: titleEl ? titleEl.value : "",
          severity: severityEl ? severityEl.value : "",
          description: descriptionEl ? descriptionEl.value : "",
          files: files.slice(),
        },
      })
    );
  }

  browse?.addEventListener("click", onBrowse);
  fileInput?.addEventListener("change", onFileChange);
  dropzone?.addEventListener("dragover", onDragOver);
  dropzone?.addEventListener("dragleave", onDragLeave);
  dropzone?.addEventListener("drop", onDrop);
  root.addEventListener("submit", onSubmit);

  return () => {
    browse?.removeEventListener("click", onBrowse);
    fileInput?.removeEventListener("change", onFileChange);
    dropzone?.removeEventListener("dragover", onDragOver);
    dropzone?.removeEventListener("dragleave", onDragLeave);
    dropzone?.removeEventListener("drop", onDrop);
    root.removeEventListener("submit", onSubmit);
  };
}

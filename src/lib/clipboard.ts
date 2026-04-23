export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard non disponibile");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const execCommand = (document as Document & { execCommand?: (commandId: string) => boolean }).execCommand;
  if (typeof execCommand !== "function") {
    document.body.removeChild(textarea);
    throw new Error("Clipboard non disponibile");
  }
  const copied = execCommand.call(document, "copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copia negli appunti non riuscita");
  }
}

// Download and copy for the Merged Result (S3-08). The text is used exactly as it is in the
// pane: nothing is added, trimmed or converted, so the file matches what the user sees.

export const DOWNLOAD_NAME = "merged-result.txt";
export const MIME_TYPE = "text/plain;charset=utf-8";

export const EMPTY_MESSAGE = "There is nothing to download yet. Compare two versions first.";
export const EMPTY_COPY_MESSAGE = "There is nothing to copy yet. Compare two versions first.";

export function makeBlob(text, BlobCtor = globalThis.Blob) {
  return new BlobCtor([text], { type: MIME_TYPE });
}

// Saves the text as a file through a temporary link. Returns { ok, message }.
export function downloadText(
  text,
  {
    doc = globalThis.document,
    urlApi = globalThis.URL,
    BlobCtor = globalThis.Blob,
    filename = DOWNLOAD_NAME,
    setTimer = (fn, ms) => globalThis.setTimeout(fn, ms)
  } = {}
) {
  if (text === "") return { ok: false, message: EMPTY_MESSAGE };
  try {
    const url = urlApi.createObjectURL(makeBlob(text, BlobCtor));
    const link = doc.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.hidden = true;
    doc.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a moment to start the download before the address is released.
    setTimer(() => urlApi.revokeObjectURL(url), 1000);
    return { ok: true, message: `Downloaded ${filename}.` };
  } catch {
    return { ok: false, message: "The file could not be downloaded." };
  }
}

// Copies the text to the clipboard. Uses the modern clipboard when the page may use it and
// falls back to a hidden textarea otherwise. Resolves to { ok, message } and never throws.
export async function copyText(text, { nav, doc = globalThis.document } = {}) {
  if (text === "") return { ok: false, message: EMPTY_COPY_MESSAGE };
  try {
    // Prefer an explicitly injected navigator in tests/embedders; otherwise feature-detect
    // the browser's native navigator.clipboard API (not available in every browser context).
    const clipboard = nav !== undefined
      ? nav?.clipboard
      : (typeof globalThis.navigator !== "undefined" ? globalThis.navigator.clipboard : undefined);
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      return { ok: true, message: "Copied the merged result." };
    }
  } catch (error) {
    // fall through to the older way
  }
  try {
    const area = doc.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    doc.body.appendChild(area);
    area.select();
    const copied = doc.execCommand("copy");
    area.remove();
    if (copied) return { ok: true, message: "Copied the merged result." };
  } catch (error) {
    // report below
  }
  return { ok: false, message: "Copying was blocked. Select the text and copy it by hand." };
}

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const SNIFF_BYTES = 8000;

function readAs(file, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader[method](file);
  });
}

// A NUL byte in the first few KB is the usual sign of a binary file.
function looksBinary(buffer) {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, SNIFF_BYTES));
  for (let i = 0; i < bytes.length; i++) if (bytes[i] === 0) return true;
  return false;
}

// Resolves to { ok: true, name, text } or { ok: false, name, error }. Never throws.
export async function loadFile(file) {
  const name = file && file.name ? file.name : "";
  try {
    if (!file) return { ok: false, name, error: "No file was selected." };
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, name, error: "The file is larger than 2 MB." };
    }
    const buffer = await readAs(file, "readAsArrayBuffer");
    if (looksBinary(buffer)) {
      return { ok: false, name, error: "This looks like a binary file. Please choose a text file." };
    }
    let text = await readAs(file, "readAsText");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // drop a byte order mark
    return { ok: true, name, text };
  } catch {
    return { ok: false, name, error: "The file could not be read." };
  }
}

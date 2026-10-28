/**
 * Loading a version from a file: size and content checks, then decoding to text.
 * Works on plain objects with name, size and arrayBuffer(), which is what a browser File provides,
 * so it can be tested without a browser.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const SNIFF_BYTES = 8000;

/** True if the bytes look like a binary file: a NUL byte near the start, or not valid UTF-8. */
export function looksBinary(bytes) {
  const end = Math.min(bytes.length, SNIFF_BYTES);
  for (let i = 0; i < end; i++) {
    if (bytes[i] === 0) return true;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return false;
  } catch {
    return true;
  }
}

/** Decode UTF-8 bytes to text. A leading byte-order mark is dropped; everything else is kept exactly. */
export function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

/** Check the size before reading anything. Returns an error message, or null if fine. */
export function checkSize(size, max = MAX_FILE_BYTES) {
  if (size > max) {
    return `This file is too large. Files over ${max / (1024 * 1024)} MB are not accepted.`;
  }
  return null;
}

/**
 * Read a file into text.
 * Resolves to { ok: true, name, text } or { ok: false, name, error }. It never throws.
 */
export async function loadFile(file, max = MAX_FILE_BYTES) {
  const name = file && file.name ? file.name : "file";
  try {
    const sizeError = checkSize(file.size, max);
    if (sizeError) return { ok: false, name, error: sizeError };

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (looksBinary(bytes)) {
      return { ok: false, name, error: `"${name}" is not a text file, so it was not loaded.` };
    }
    return { ok: true, name, text: decodeText(bytes) };
  } catch {
    return { ok: false, name, error: `"${name}" could not be read.` };
  }
}

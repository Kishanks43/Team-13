/**
 * Loading a version from a file.
 * Works on plain objects with name, size and arrayBuffer(), which is what a browser File provides,
 * so it can be tested without a browser.
 */

/** Decode UTF-8 bytes to text. A leading byte-order mark is dropped; everything else is kept exactly. */
export function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Read a file into text.
 * Resolves to { ok: true, name, text } or { ok: false, name, error }. It never throws.
 */
export async function loadFile(file) {
  const name = file && file.name ? file.name : "file";
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return { ok: true, name, text: decodeText(bytes) };
  } catch {
    return { ok: false, name, error: `"${name}" could not be read.` };
  }
}

/* global TextDecoder */
// File reading and validation (S1-01 contract, S1-05 checks).
//
// loadFile(file) resolves to { ok: true, name, text } or { ok: false, name, error }.
// It never throws. It refuses files over 2 MB, binary files, and text that is not UTF-8.

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

const SAMPLE_BYTES = 8192; // how much of the start of a file is inspected for binary data
const MAX_CONTROL_RATIO = 0.1; // more control bytes than this in the sample means binary

// Start-of-file signatures of common non-text formats, for a clearer message.
const SIGNATURES = [
  { label: "a PDF", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { label: "a PNG image", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { label: "a JPEG image", bytes: [0xff, 0xd8, 0xff] },
  { label: "a GIF image", bytes: [0x47, 0x49, 0x46, 0x38] },
  { label: "a ZIP archive", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { label: "a gzip archive", bytes: [0x1f, 0x8b] },
  { label: "an executable", bytes: [0x7f, 0x45, 0x4c, 0x46] }
];

// Tab, line feed, form feed and carriage return are normal in text.
const isTextControl = (byte) => byte === 9 || byte === 10 || byte === 12 || byte === 13;

export function formatBytes(count) {
  if (count < 1024) return `${count} bytes`;
  if (count < 1024 * 1024) return `${(count / 1024).toFixed(1)} KB`;
  return `${(count / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns a short description of why the bytes look binary, or null if they look like text.
export function describeBinary(bytes) {
  for (const { label, bytes: signature } of SIGNATURES) {
    if (bytes.length >= signature.length && signature.every((value, i) => bytes[i] === value)) {
      return label;
    }
  }
  const end = Math.min(bytes.length, SAMPLE_BYTES);
  let controls = 0;
  for (let i = 0; i < end; i++) {
    if (bytes[i] === 0) return "binary data";
    if (bytes[i] < 32 && !isTextControl(bytes[i])) controls++;
  }
  if (end > 0 && controls / end > MAX_CONTROL_RATIO) return "binary data";
  return null;
}

export function looksBinary(bytes) {
  return describeBinary(bytes) !== null;
}

const fail = (name, error) => ({ ok: false, name, error });
const label = (name) => (name ? `"${name}"` : "This file");
const limitText = `${MAX_FILE_BYTES / (1024 * 1024)} MB`;
const tooLarge = (name, size) =>
  fail(name, `${label(name)} is too large (${formatBytes(size)}). Files must be ${limitText} or smaller.`);

export async function loadFile(file) {
  const name = file && typeof file.name === "string" ? file.name : "";
  try {
    if (!file) return fail(name, "No file was chosen.");

    // Check the size first, so a huge file is never read into memory.
    if (file.size > MAX_FILE_BYTES) return tooLarge(name, file.size);

    let bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      return fail(name, `${label(name)} could not be read. Please try again.`);
    }
    // The size reported by the file can be wrong, so check what was actually read too.
    if (bytes.length > MAX_FILE_BYTES) return tooLarge(name, bytes.length);

    const utf16 = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);
    if (utf16) {
      return fail(name, `${label(name)} is UTF-16 text. Please save it as UTF-8 and try again.`);
    }

    const reason = describeBinary(bytes);
    if (reason) {
      return fail(name, `${label(name)} looks like ${reason}, not a text file. Please choose a code or text file.`);
    }

    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return fail(name, `${label(name)} is not valid UTF-8 text. Please save it as UTF-8 and try again.`);
    }
    return { ok: true, name, text };
  } catch {
    return fail(name, `${label(name)} could not be read. Please try again.`);
  }
}

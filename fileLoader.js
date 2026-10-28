
/**
 * Loading a version from a file: size and content checks, then decoding to text.
 * Works on plain objects with name, size and arrayBuffer(), which is what a browser File provides,
 * so it can be tested without a browser.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const SNIFF_BYTES = 8000;

/**
 * True if the bytes look binary:
 * - contain a NUL byte near the start, or
 * - contain invalid UTF-8 anywhere in the file.
 */
export function looksBinary(bytes) {
  const end = Math.min(bytes.length, SNIFF_BYTES);

  for (let i = 0; i < end; i++) {
    if (bytes[i] === 0) {
      return true;
    }
  }

  try {
    // Validate the complete file, not just the first few thousand bytes.
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return false;
  } catch {
    return true;
  }
}

/**
 * Decode UTF-8 bytes into text.
 * A leading byte-order mark is removed by TextDecoder by default.
 */
export function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Check file size before reading it.
 * Returns an error message or null if the size is acceptable.
 */
export function checkSize(size, max = MAX_FILE_BYTES) {
  if (!Number.isFinite(size) || size < 0) {
    return "Invalid file size.";
  }

  if (size > max) {
    return `This file is too large. Files over ${max / (1024 * 1024)} MB are not accepted.`;
  }

  return null;
}

/**
 * Read a file into text.
 *
 * Success:
 *   { ok: true, name, text }
 *
 * Failure:
 *   { ok: false, name, error }
 *
 * Never throws. The caller should update the pane only when ok is true,
 * so a rejected file does not replace existing pane text.
 */
export async function loadFile(file, max = MAX_FILE_BYTES) {
  const name =
    file && typeof file.name === "string" && file.name.length > 0
      ? file.name
      : "file";

  try {
    if (!file || typeof file.arrayBuffer !== "function") {
      return {
        ok: false,
        name,
        error: `"${name}" could not be read.`,
      };
    }

    const sizeError = checkSize(file.size, max);

    if (sizeError) {
      return {
        ok: false,
        name,
        error: sizeError,
      };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Protect against a file whose actual content size differs from its metadata.
    const actualSizeError = checkSize(bytes.byteLength, max);

    if (actualSizeError) {
      return {
        ok: false,
        name,
        error: actualSizeError,
      };
    }

    if (looksBinary(bytes)) {
      return {
        ok: false,
        name,
        error: `"${name}" is not a valid text file, so it was not loaded.`,
      };
    }

    return {
      ok: true,
      name,
      text: decodeText(bytes),
    };
  } catch {
    return {
      ok: false,
      name,
      error: `"${name}" could not be read.`,
    };
  }
}

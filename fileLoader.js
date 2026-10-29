```javascript
/**
 * File loader for the Code Merge Simulator.
 *
 * Features:
 * - Enforces a 2 MB file size limit.
 * - Rejects binary files instead of displaying garbage text.
 * - Validates UTF-8 content.
 * - Handles unreadable files safely.
 * - Preserves existing pane content when a file is rejected.
 *
 * Works with browser File objects and test doubles.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MiB

const SNIFF_BYTES = 8000;

/**
 * Determines whether a byte array appears to contain binary data.
 *
 * A file is considered binary if:
 * - It contains a NUL byte in the initial sniffing region, or
 * - Its contents are not valid UTF-8.
 *
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function looksBinary(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    return true;
  }

  const end = Math.min(bytes.length, SNIFF_BYTES);

  for (let i = 0; i < end; i++) {
    if (bytes[i] === 0) {
      return true;
    }
  }

  try {
    // Validate the entire file, not just the initial sniffing region.
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return false;
  } catch {
    return true;
  }
}

/**
 * Decodes UTF-8 bytes into text.
 *
 * A leading UTF-8 byte-order mark is removed by default.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decodeText(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/**
 * Checks whether a file size is acceptable.
 *
 * @param {number} size
 * @param {number} max
 * @returns {string|null}
 */
export function checkSize(size, max = MAX_FILE_BYTES) {
  if (!Number.isSafeInteger(size) || size < 0) {
    return "Invalid file size.";
  }

  if (!Number.isSafeInteger(max) || max < 0) {
    return "Invalid file size limit.";
  }

  if (size > max) {
    const maxMB = max / (1024 * 1024);

    return `This file is too large. Files over ${maxMB} MB are not accepted.`;
  }

  return null;
}

/**
 * Loads a file and validates its size and content before returning text.
 *
 * Success:
 *   { ok: true, name, text }
 *
 * Failure:
 *   { ok: false, name, error }
 *
 * This function does not throw. The caller should update the editor pane
 * only when result.ok is true.
 *
 * @param {File|object} file
 * @param {number} max
 * @returns {Promise<
 *   {ok: true, name: string, text: string} |
 *   {ok: false, name: string, error: string}
 * >}
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

    // Validate the configured limit and metadata before reading the file.
    const sizeError = checkSize(file.size, max);

    if (sizeError) {
      return {
        ok: false,
        name,
        error: sizeError,
      };
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify actual content size instead of trusting metadata alone.
    const actualSizeError = checkSize(bytes.byteLength, max);

    if (actualSizeError) {
      return {
        ok: false,
        name,
        error: actualSizeError,
      };
    }

    // Reject binary or invalid UTF-8 content.
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
```

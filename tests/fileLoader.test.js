```javascript
import { describe, test, expect } from "@jest/globals";
import {
  MAX_FILE_BYTES,
  looksBinary,
  decodeText,
  checkSize,
  loadFile,
} from "../src/fileLoader.js";

// A minimal stand-in for a browser File.
function fakeFile(name, content, options = {}) {
  const bytes =
    typeof content === "string"
      ? new TextEncoder().encode(content)
      : content;

  return {
    name,
    size: options.size ?? bytes.length,
    arrayBuffer: async () =>
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ),
  };
}

describe("decodeText", () => {
  test("keeps tabs, trailing spaces and Windows line endings exactly", () => {
    const text = "a\t b  \r\nc \r\n\r\n";

    expect(decodeText(new TextEncoder().encode(text))).toBe(text);
  });

  test("keeps accents and emoji", () => {
    const text = "café ✓ 日本語 🙂";

    expect(decodeText(new TextEncoder().encode(text))).toBe(text);
  });

  test("drops a leading byte-order mark only", () => {
    const bytes = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...new TextEncoder().encode("x"),
    ]);

    expect(decodeText(bytes)).toBe("x");
  });

  test("rejects invalid UTF-8 when decoding directly", () => {
    const bytes = new Uint8Array([0xc3, 0x28]);

    expect(() => decodeText(bytes)).toThrow();
  });
});

describe("checkSize", () => {
  test("accepts a file within the 2 MB limit", () => {
    expect(checkSize(MAX_FILE_BYTES)).toBeNull();
  });

  test("rejects a file larger than 2 MB", () => {
    expect(checkSize(MAX_FILE_BYTES + 1)).toMatch(/too large/i);
  });

  test("rejects negative file sizes", () => {
    expect(checkSize(-1)).toBe("Invalid file size.");
  });

  test("rejects non-numeric and non-finite file sizes", () => {
    expect(checkSize(Number.NaN)).toBe("Invalid file size.");
    expect(checkSize(Infinity)).toBe("Invalid file size.");
    expect(checkSize("100")).toBe("Invalid file size.");
  });
});

describe("looksBinary", () => {
  test("accepts ordinary UTF-8 text", () => {
    const bytes = new TextEncoder().encode("Hello, world!\n");

    expect(looksBinary(bytes)).toBe(false);
  });

  test("rejects content containing a NUL byte near the start", () => {
    const bytes = new Uint8Array([0x48, 0x69, 0x00, 0x21]);

    expect(looksBinary(bytes)).toBe(true);
  });

  test("rejects invalid UTF-8 content", () => {
    const bytes = new Uint8Array([0xc3, 0x28]);

    expect(looksBinary(bytes)).toBe(true);
  });

  test("rejects input that is not a Uint8Array", () => {
    expect(looksBinary("plain text")).toBe(true);
  });
});

describe("loadFile", () => {
  test("loads a text file", async () => {
    const result = await loadFile(fakeFile("a.js", "let x = 1;\n"));

    expect(result).toEqual({
      ok: true,
      name: "a.js",
      text: "let x = 1;\n",
    });
  });

  test("loads an empty file as empty text", async () => {
    const result = await loadFile(fakeFile("empty.txt", ""));

    expect(result).toEqual({
      ok: true,
      name: "empty.txt",
      text: "",
    });
  });

  test("rejects files larger than 2 MB before reading", async () => {
    const file = {
      name: "large.txt",
      size: MAX_FILE_BYTES + 1,
      arrayBuffer: async () => {
        throw new Error("Should not read oversized file");
      },
    };

    const result = await loadFile(file);

    expect(result.ok).toBe(false);
    expect(result.name).toBe("large.txt");
    expect(result.error).toMatch(/too large/i);
  });

  test("accepts a valid text file exactly 2 MB in size", async () => {
    const content = "a".repeat(MAX_FILE_BYTES);
    const result = await loadFile(fakeFile("limit.txt", content));

    expect(result.ok).toBe(true);
    expect(result.text.length).toBe(MAX_FILE_BYTES);
  });

  test("rejects binary content instead of loading it as text", async () => {
    const bytes = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, 0x00, 0x01,
    ]);

    const result = await loadFile(fakeFile("image.png", bytes));

    expect(result.ok).toBe(false);
    expect(result.name).toBe("image.png");
    expect(result.error).toMatch(/not a valid text file/i);
  });

  test("rejects invalid UTF-8 files", async () => {
    const bytes = new Uint8Array([0xc3, 0x28]);
    const result = await loadFile(fakeFile("invalid.txt", bytes));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not a valid text file/i);
  });

  test("checks actual file size even when metadata is incorrect", async () => {
    const content = "a".repeat(20);
    const file = fakeFile("mismatch.txt", content, {
      size: 1,
    });

    const result = await loadFile(file, 10);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  test("reports a read failure instead of throwing", async () => {
    const broken = {
      name: "gone.txt",
      size: 10,
      arrayBuffer: async () => {
        throw new Error("disk error");
      },
    };

    const result = await loadFile(broken);

    expect(result).toEqual({
      ok: false,
      name: "gone.txt",
      error: '"gone.txt" could not be read.',
    });
  });

  test("rejects an invalid file object", async () => {
    const result = await loadFile({
      name: "invalid.txt",
      size: 10,
    });

    expect(result).toEqual({
      ok: false,
      name: "invalid.txt",
      error: '"invalid.txt" could not be read.',
    });
  });

  test("a 500-line file loads in under a second", async () => {
    const text = Array.from(
      { length: 500 },
      (_, i) => `line ${i + 1}: const value = ${i};`
    ).join("\n");

    const start = performance.now();
    const result = await loadFile(fakeFile("big.js", text));
    const elapsed = performance.now() - start;

    expect(result.ok).toBe(true);
    expect(result.text).toBe(text);
    expect(elapsed).toBeLessThan(1000);
  });
});
```

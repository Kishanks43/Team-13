import { describe, test, expect } from "@jest/globals";
import { MAX_FILE_BYTES, looksBinary, decodeText, checkSize, loadFile } from "../src/fileLoader.js";

// A minimal stand-in for a browser File.
function fakeFile(name, content) {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  return {
    name,
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

describe("looksBinary", () => {
  test("plain text is not binary", () => {
    expect(looksBinary(new TextEncoder().encode("function a() {\n  return 1;\n}\n"))).toBe(false);
  });

  test("text with accents and emoji is not binary", () => {
    expect(looksBinary(new TextEncoder().encode("café ✓ 日本語 🙂"))).toBe(false);
  });

  test("an empty file is not binary", () => {
    expect(looksBinary(new Uint8Array(0))).toBe(false);
  });

  test("a NUL byte means binary", () => {
    expect(looksBinary(new Uint8Array([72, 105, 0, 33]))).toBe(true);
  });

  test("a PNG header is binary", () => {
    expect(looksBinary(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]))).toBe(true);
  });

  test("bytes that are not valid UTF-8 are binary", () => {
    expect(looksBinary(new Uint8Array([0xff, 0xfe, 0xfd, 0xc3]))).toBe(true);
  });
});

describe("checkSize", () => {
  test("exactly 2 MB is accepted", () => {
    expect(checkSize(MAX_FILE_BYTES)).toBeNull();
  });

  test("one byte over 2 MB is refused with a clear message", () => {
    const message = checkSize(MAX_FILE_BYTES + 1);
    expect(message).toMatch(/too large/);
    expect(message).toMatch(/2 MB/);
    expect(message).toMatch(/not accepted/);
  });
});

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
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("x")]);
    expect(decodeText(bytes)).toBe("x");
  });
});

describe("loadFile", () => {
  test("loads a text file", async () => {
    const result = await loadFile(fakeFile("a.js", "let x = 1;\n"));
    expect(result).toEqual({ ok: true, name: "a.js", text: "let x = 1;\n" });
  });

  test("loads an empty file as empty text", async () => {
    const result = await loadFile(fakeFile("empty.txt", ""));
    expect(result).toEqual({ ok: true, name: "empty.txt", text: "" });
  });

  test("refuses a binary file with a message naming it", async () => {
    const result = await loadFile(fakeFile("logo.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 1])));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/logo\.png/);
    expect(result.error).toMatch(/not a text file/);
  });

  test("refuses an oversize file without reading it", async () => {
    let read = false;
    const big = {
      name: "huge.txt",
      size: MAX_FILE_BYTES + 1,
      arrayBuffer: async () => {
        read = true;
        return new ArrayBuffer(0);
      },
    };
    const result = await loadFile(big);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not accepted/);
    expect(read).toBe(false);
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
    expect(result).toEqual({ ok: false, name: "gone.txt", error: '"gone.txt" could not be read.' });
  });

  test("a 500-line file loads in under a second", async () => {
    const text = Array.from({ length: 500 }, (_, i) => `line ${i + 1}: const value = ${i};`).join("\n");
    const start = performance.now();
    const result = await loadFile(fakeFile("big.js", text));
    const elapsed = performance.now() - start;
    expect(result.ok).toBe(true);
    expect(result.text).toBe(text);
    expect(elapsed).toBeLessThan(1000);
  });
});

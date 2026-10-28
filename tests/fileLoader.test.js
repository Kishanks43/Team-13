import { describe, test, expect } from "@jest/globals";
import { decodeText, loadFile } from "../src/fileLoader.js";

// A minimal stand-in for a browser File.
function fakeFile(name, content) {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  return {
    name,
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
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

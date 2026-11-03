/* global File */
import { describe, test, expect, jest } from "@jest/globals";
import { loadFile, looksBinary, describeBinary, formatBytes, MAX_FILE_BYTES } from "../src/fileLoader.js";

const textFile = (content, name = "a.js") => new File([content], name, { type: "text/plain" });
const bytesFile = (bytes, name = "data.bin") => new File([new Uint8Array(bytes)], name);

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("accepted files (S1-04 behaviour stays intact)", () => {
  test("returns ok, the name and the exact text", async () => {
    expect(await loadFile(textFile("let x = 1;\n", "x.js"))).toEqual({ ok: true, name: "x.js", text: "let x = 1;\n" });
  });

  test("keeps line endings, tabs, trailing spaces and unicode exactly", async () => {
    const text = "a\r\nb\rc\n\tindent  \nunicode ✓ é 😀\n";
    expect((await loadFile(textFile(text))).text).toBe(text);
  });

  test("an empty file loads as empty text", async () => {
    expect(await loadFile(textFile(""))).toEqual({ ok: true, name: "a.js", text: "" });
  });

  test("a UTF-8 byte order mark is dropped, the text is kept", async () => {
    const result = await loadFile(bytesFile([0xef, 0xbb, 0xbf, 0x68, 0x69], "bom.txt"));
    expect(result).toEqual({ ok: true, name: "bom.txt", text: "hi" });
  });

  test("a 500-line file loads in under 1 second", async () => {
    const text = Array.from({ length: 500 }, (_, i) => `const line${i} = ${i};`).join("\n");
    const started = Date.now();
    const result = await loadFile(textFile(text, "big.js"));
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result.ok).toBe(true);
    expect(result.text.split("\n")).toHaveLength(500);
  });

  test("ordinary control characters in text are fine (tab, form feed, ANSI colour codes)", async () => {
    const text = "col1\tcol2\n\f\u001b[31mred\u001b[0m\n";
    expect((await loadFile(textFile(text, "log.txt"))).ok).toBe(true);
  });
});

describe("files over 2 MB are refused", () => {
  test("the limit is exactly 2 MB", () => {
    expect(MAX_FILE_BYTES).toBe(2 * 1024 * 1024);
  });

  test("a file of exactly 2 MB is accepted", async () => {
    const result = await loadFile(textFile("a".repeat(MAX_FILE_BYTES), "edge.txt"));
    expect(result.ok).toBe(true);
    expect(result.text).toHaveLength(MAX_FILE_BYTES);
  });

  test("one byte over is refused with a clear message", async () => {
    const result = await loadFile(textFile("a".repeat(MAX_FILE_BYTES + 1), "huge.txt"));
    expect(result.ok).toBe(false);
    expect(result.name).toBe("huge.txt");
    expect(result.error).toContain('"huge.txt"');
    expect(result.error).toContain("too large");
    expect(result.error).toContain("2 MB");
    expect(result).not.toHaveProperty("text");
  });

  test("a file that is too large is never read into memory", async () => {
    const arrayBuffer = jest.fn();
    const result = await loadFile({ name: "big.txt", size: MAX_FILE_BYTES + 1, arrayBuffer });
    expect(result.ok).toBe(false);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  test("a file whose reported size is wrong is still refused", async () => {
    const liar = {
      name: "liar.txt",
      size: 10,
      arrayBuffer: async () => new Uint8Array(MAX_FILE_BYTES + 1).fill(97).buffer
    };
    const result = await loadFile(liar);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("too large");
  });
});

describe("binary files are refused", () => {
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const cases = [
    ["a PNG image", PNG],
    ["a PDF", [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]],
    ["a JPEG image", [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]],
    ["a GIF image", [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    ["a ZIP archive", [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]],
    ["a gzip archive", [0x1f, 0x8b, 0x08, 0x00]],
    ["an executable", [0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]]
  ];

  test.each(cases)("%s is refused and named in the message", async (label, bytes) => {
    const result = await loadFile(bytesFile(bytes, "thing.dat"));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('"thing.dat"');
    expect(result.error).toContain(label);
    expect(result.error).toContain("not a text file");
  });

  test("a single NUL byte among text is enough", async () => {
    // One NUL in 200 bytes is far below the control-character ratio, so only the NUL check can catch it.
    const bytes = new Array(200).fill(97);
    bytes[100] = 0;
    const result = await loadFile(bytesFile(bytes, "nul.txt"));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("binary data");
  });

  test("lots of control characters mean binary", async () => {
    const bytes = Array.from({ length: 200 }, (_, i) => (i % 2 === 0 ? 0x01 : 0x61));
    expect((await loadFile(bytesFile(bytes))).ok).toBe(false);
  });

  test("a binary file renamed to .txt is still refused", async () => {
    expect((await loadFile(bytesFile(PNG, "photo.txt"))).ok).toBe(false);
  });

  test("UTF-16 text gets its own, helpful message", async () => {
    const result = await loadFile(bytesFile([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00], "wide.txt"));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("UTF-16");
    expect(result.error).toContain("save it as UTF-8");
  });

  test("text that is not valid UTF-8 is refused with a clear message", async () => {
    const result = await loadFile(bytesFile([0x68, 0x69, 0xc3, 0x28], "latin.txt"));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("not valid UTF-8");
  });
});

describe("loadFile never throws", () => {
  test.each([[null], [undefined], [{}], [42], ["text"], [{ name: 7 }]])("bad input %p gives an error result", async (input) => {
    const result = await loadFile(input);
    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error.length).toBeGreaterThan(0);
  });

  test("a file that fails to read gives an error result", async () => {
    const broken = { name: "broken.txt", size: 5, arrayBuffer: async () => { throw new Error("disk gone"); } };
    const result = await loadFile(broken);
    expect(result).toEqual({ ok: false, name: "broken.txt", error: '"broken.txt" could not be read. Please try again.' });
  });

  test("no file chosen has its own message", async () => {
    expect((await loadFile(undefined)).error).toBe("No file was chosen.");
  });

  test("every error message is a full sentence with no raw error text", async () => {
    const results = [
      await loadFile(bytesFile([0, 1, 2], "a.bin")),
      await loadFile(textFile("a".repeat(MAX_FILE_BYTES + 1), "b.txt")),
      await loadFile(bytesFile([0xc3, 0x28], "c.txt"))
    ];
    for (const result of results) {
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/\.$/);
      expect(result.error).not.toMatch(/undefined|\[object|Error:/);
    }
  });
});

describe("looksBinary, describeBinary and formatBytes", () => {
  test("plain text bytes are not binary", () => {
    expect(looksBinary(new Uint8Array([104, 105, 10]))).toBe(false);
    expect(describeBinary(new Uint8Array([]))).toBeNull();
  });

  test("a NUL byte past the inspected start is not looked for (documented limit)", () => {
    const bytes = new Uint8Array(9000).fill(97);
    bytes[8500] = 0;
    expect(looksBinary(bytes)).toBe(false);
  });

  test("formats sizes for messages", () => {
    expect(formatBytes(500)).toBe("500 bytes");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(3 * 1024 * 1024 + 419430)).toBe("3.4 MB");
  });
});

describe("properties", () => {
  test("any printable text file loads back exactly as written", async () => {
    const rand = seeded(11);
    const pool = ["a", "Z", " ", "\t", "\n", "\r\n", "é", "✓", "😀", "{", "}", ";"];
    for (let round = 0; round < 100; round++) {
      const text = Array.from({ length: Math.floor(rand() * 200) }, () => pool[Math.floor(rand() * pool.length)]).join("");
      const result = await loadFile(textFile(text, "p.txt"));
      expect(result).toEqual({ ok: true, name: "p.txt", text });
    }
  });

  test("random bytes with a NUL near the start are always refused", async () => {
    const rand = seeded(5);
    for (let round = 0; round < 100; round++) {
      const bytes = Array.from({ length: 20 + Math.floor(rand() * 300) }, () => 32 + Math.floor(rand() * 90));
      bytes[Math.floor(rand() * 20)] = 0;
      expect((await loadFile(bytesFile(bytes))).ok).toBe(false);
    }
  });

  test("a result is always either ok with text, or not ok with an error", async () => {
    const rand = seeded(99);
    for (let round = 0; round < 100; round++) {
      const bytes = Array.from({ length: Math.floor(rand() * 64) }, () => Math.floor(rand() * 256));
      const result = await loadFile(bytesFile(bytes));
      if (result.ok) {
        expect(typeof result.text).toBe("string");
      } else {
        expect(typeof result.error).toBe("string");
      }
    }
  });
});

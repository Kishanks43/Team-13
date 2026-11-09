/** @jest-environment jsdom */
import { describe, test, expect } from "@jest/globals";
import { loadFile, MAX_FILE_BYTES } from "../src/fileLoader.js";

describe("loadFile", () => {
  test("reads a text file and strips a BOM", async () => {
    const result = await loadFile(new File(["\ufeffhello\nworld"], "a.txt", { type: "text/plain" }));
    expect(result).toEqual({ ok: true, name: "a.txt", text: "hello\nworld" });
  });
  test("rejects binary files", async () => {
    const result = await loadFile(new File([new Uint8Array([1, 2, 0, 3])], "x.bin"));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/binary/i);
  });
  test("rejects files over 2 MB without reading them", async () => {
    const big = new File(["x"], "big.txt");
    Object.defineProperty(big, "size", { value: MAX_FILE_BYTES + 1 });
    const result = await loadFile(big);
    expect(result).toMatchObject({ ok: false, name: "big.txt" });
    expect(result.error).toMatch(/2 MB/);
  });
  test("no file is a clean error, never a throw", async () => {
    expect((await loadFile(undefined)).ok).toBe(false);
  });
});

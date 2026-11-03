import { describe, test, expect } from "@jest/globals";
import { splitLines, diffText, diffLines, summarize, countChangeRegions } from "../src/engine/diff.js";

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("splitLines", () => {
  test("handles empty text, LF, CRLF and CR", () => {
    expect(splitLines("")).toEqual([]);
    expect(splitLines("a\nb")).toEqual(["a", "b"]);
    expect(splitLines("a\r\nb")).toEqual(["a", "b"]);
    expect(splitLines("a\rb")).toEqual(["a", "b"]);
  });
  test("a trailing newline does not add an empty line", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
    expect(splitLines("a\n\n")).toEqual(["a", ""]);
  });
});

describe("diffText", () => {
  test("identical text is all equal", () => {
    const ops = diffText("a\nb\nc", "a\nb\nc");
    expect(ops.every((op) => op.type === "equal")).toBe(true);
    expect(ops).toHaveLength(3);
  });

  test("reports line numbers (1-based, null where absent)", () => {
    const ops = diffText("a\nb\nc", "a\nx\nc");
    expect(ops).toEqual([
      { type: "equal", text: "a", aLine: 1, bLine: 1 },
      { type: "remove", text: "b", aLine: 2, bLine: null },
      { type: "add", text: "x", aLine: null, bLine: 2 },
      { type: "equal", text: "c", aLine: 3, bLine: 3 }
    ]);
  });

  test("removals come before additions inside a run", () => {
    const ops = diffText("a\nb\nc\nd", "a\nx\ny\nd");
    expect(ops.map((op) => op.type)).toEqual(["equal", "remove", "remove", "add", "add", "equal"]);
  });

  test("empty inputs", () => {
    expect(diffText("", "")).toEqual([]);
    expect(diffText("", "a").map((op) => op.type)).toEqual(["add"]);
    expect(diffText("a", "").map((op) => op.type)).toEqual(["remove"]);
  });

  test("random inputs reproduce both sides exactly", () => {
    const rand = seeded(42);
    const alphabet = ["a", "b", "c", "d", "e"];
    for (let round = 0; round < 200; round++) {
      const make = () => Array.from({ length: Math.floor(rand() * 12) }, () => alphabet[Math.floor(rand() * 5)]);
      const a = make();
      const b = make();
      const ops = diffLines(a, b);
      expect(ops.filter((op) => op.type !== "add").map((op) => op.text)).toEqual(a);
      expect(ops.filter((op) => op.type !== "remove").map((op) => op.text)).toEqual(b);
    }
  });

  test("two different 2,000-line files diff within 2 seconds", () => {
    const a = Array.from({ length: 2000 }, (_, i) => `a-line-${i}`).join("\n");
    const b = Array.from({ length: 2000 }, (_, i) => `b-line-${i}`).join("\n");
    const started = Date.now();
    const ops = diffText(a, b);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(summarize(ops)).toEqual({ added: 2000, removed: 2000, unchanged: 0 });
  });
});

describe("summarize and countChangeRegions", () => {
  test("count lines and regions", () => {
    const ops = diffText("a\nb\nc\nd\ne", "a\nB\nc\nd\nE\nF");
    expect(summarize(ops)).toEqual({ added: 3, removed: 2, unchanged: 3 });
    expect(countChangeRegions(ops)).toBe(2);
  });
  test("no changes means no regions", () => {
    expect(countChangeRegions(diffText("a\nb", "a\nb"))).toBe(0);
  });
});

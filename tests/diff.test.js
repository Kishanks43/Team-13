import { describe, test, expect } from "@jest/globals";
import { splitLines, diffText, summarize, countChangeRegions } from "../src/engine/diff.js";

const rebuild = (ops, side) =>
  ops.filter((o) => o.type === "equal" || o.type === (side === "a" ? "remove" : "add")).map((o) => o.text);

describe("splitLines", () => {
  test("empty text has no lines", () => expect(splitLines("")).toEqual([]));
  test("handles LF, CRLF and CR", () => expect(splitLines("a\r\nb\nc\rd")).toEqual(["a", "b", "c", "d"]));
  test("a trailing newline adds no extra line", () => expect(splitLines("a\nb\n")).toEqual(["a", "b"]));
  test("a lone newline is one empty line", () => expect(splitLines("\n")).toEqual([""]));
});

describe("diffText", () => {
  test("identical text is all equal", () => {
    const ops = diffText("a\nb", "a\nb");
    expect(ops.every((o) => o.type === "equal")).toBe(true);
    expect(countChangeRegions(ops)).toBe(0);
  });
  test("both empty gives no ops", () => expect(diffText("", "")).toEqual([]));
  test("pure addition and pure removal", () => {
    expect(summarize(diffText("", "x\ny"))).toEqual({ added: 2, removed: 0, unchanged: 0 });
    expect(summarize(diffText("x\ny", ""))).toEqual({ added: 0, removed: 2, unchanged: 0 });
  });
  test("a changed line is one remove then one add", () => {
    const ops = diffText("a\nb\nc", "a\nB\nc");
    expect(ops.map((o) => o.type)).toEqual(["equal", "remove", "add", "equal"]);
    expect(ops[1]).toMatchObject({ text: "b", aLine: 2, bLine: null });
    expect(ops[2]).toMatchObject({ text: "B", aLine: null, bLine: 2 });
  });
  test("removals always come before additions in a run", () => {
    const ops = diffText("1\n2\n3", "x\ny\n3");
    expect(ops.map((o) => o.type)).toEqual(["remove", "remove", "add", "add", "equal"]);
  });
  test("random inputs: ops rebuild both sides exactly", () => {
    let seed = 42;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let round = 0; round < 200; round++) {
      const make = () => Array.from({ length: Math.floor(rand() * 25) }, () => "L" + Math.floor(rand() * 6));
      const a = make();
      const b = make();
      const ops = diffText(a.join("\n"), b.join("\n"));
      expect(rebuild(ops, "a")).toEqual(splitLines(a.join("\n")));
      expect(rebuild(ops, "b")).toEqual(splitLines(b.join("\n")));
    }
  });
  test("diff is minimal on a known case", () => {
    const { added, removed } = summarize(diffText("a\nb\nc\nd", "a\nc\nd\ne"));
    expect(added + removed).toBe(2);
  });
});

describe("countChangeRegions", () => {
  test("counts runs", () => {
    expect(countChangeRegions(diffText("a\nb\nc\nd\ne", "a\nX\nc\nY\ne"))).toBe(2);
  });
});

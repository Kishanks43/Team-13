import { describe, test, expect } from "@jest/globals";
import { splitLines, diffLines, diffText, summarize, countChangeRegions } from "../src/engine/diff.js";

const types = (ops) => ops.map((op) => op.type);
const rebuild = (ops, keep) => ops.filter((op) => keep.includes(op.type)).map((op) => op.text);

// Small seeded random generator so the property tests are repeatable.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
function randomLines(rng, count, alphabet) {
  return Array.from({ length: count }, () => `line ${Math.floor(rng() * alphabet)}`);
}
function lcsLength(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

describe("splitLines", () => {
  test("empty text has no lines", () => {
    expect(splitLines("")).toEqual([]);
  });
  test("a trailing newline does not add an empty line", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b"]);
  });
  test("keeps blank lines in the middle", () => {
    expect(splitLines("a\n\nb")).toEqual(["a", "", "b"]);
  });
  test("handles CRLF and CR line endings", () => {
    expect(splitLines("a\r\nb\rc")).toEqual(["a", "b", "c"]);
  });
});

describe("diffLines: simple cases", () => {
  test("two empty inputs give no ops", () => {
    expect(diffLines([], [])).toEqual([]);
  });

  test("identical input is all equal", () => {
    const ops = diffLines(["a", "b", "c"], ["a", "b", "c"]);
    expect(types(ops)).toEqual(["equal", "equal", "equal"]);
    expect(countChangeRegions(ops)).toBe(0);
  });

  test("everything added when A is empty", () => {
    const ops = diffLines([], ["x", "y"]);
    expect(ops).toEqual([
      { type: "add", text: "x", aLine: null, bLine: 1 },
      { type: "add", text: "y", aLine: null, bLine: 2 },
    ]);
  });

  test("everything removed when B is empty", () => {
    const ops = diffLines(["x", "y"], []);
    expect(ops).toEqual([
      { type: "remove", text: "x", aLine: 1, bLine: null },
      { type: "remove", text: "y", aLine: 2, bLine: null },
    ]);
  });

  test("a changed line is a removal followed by an addition", () => {
    const ops = diffLines(["a", "b", "c"], ["a", "B", "c"]);
    expect(ops).toEqual([
      { type: "equal", text: "a", aLine: 1, bLine: 1 },
      { type: "remove", text: "b", aLine: 2, bLine: null },
      { type: "add", text: "B", aLine: null, bLine: 2 },
      { type: "equal", text: "c", aLine: 3, bLine: 3 },
    ]);
  });

  test("an inserted line in the middle", () => {
    const ops = diffLines(["a", "c"], ["a", "b", "c"]);
    expect(types(ops)).toEqual(["equal", "add", "equal"]);
    expect(ops[1]).toMatchObject({ text: "b", aLine: null, bLine: 2 });
    expect(ops[2]).toMatchObject({ aLine: 2, bLine: 3 });
  });

  test("a deleted line in the middle", () => {
    const ops = diffLines(["a", "b", "c"], ["a", "c"]);
    expect(types(ops)).toEqual(["equal", "remove", "equal"]);
    expect(ops[1]).toMatchObject({ text: "b", aLine: 2, bLine: null });
    expect(ops[2]).toMatchObject({ aLine: 3, bLine: 2 });
  });

  test("blank lines are compared like any other line", () => {
    const ops = diffText("a\n\nb", "a\nb");
    expect(types(ops)).toEqual(["equal", "remove", "equal"]);
    expect(ops[1].text).toBe("");
  });

  test("the classic Myers example finds the shortest edit", () => {
    const a = ["A", "B", "C", "A", "B", "B", "A"];
    const b = ["C", "B", "A", "B", "A", "C"];
    const { added, removed } = summarize(diffLines(a, b));
    expect(added + removed).toBe(5);
  });
});

describe("diffLines: fixtures", () => {
  const original = ["function total(items) {", "  let sum = 0;", "  for (const i of items) {", "    sum += i.price;", "  }", "  return sum;", "}"];

  test("two separate edits form two regions", () => {
    const edited = [...original];
    edited[1] = "  let sum = 0; // start at zero";
    edited[5] = "  return Math.round(sum);";
    const ops = diffLines(original, edited);
    expect(countChangeRegions(ops)).toBe(2);
    expect(summarize(ops)).toEqual({ added: 2, removed: 2, unchanged: 5 });
  });

  test("a block removed at the end", () => {
    const ops = diffLines(original, original.slice(0, 3));
    expect(types(ops)).toEqual(["equal", "equal", "equal", "remove", "remove", "remove", "remove"]);
    expect(countChangeRegions(ops)).toBe(1);
  });

  test("diffText works on raw strings with different line endings", () => {
    const ops = diffText("one\r\ntwo\r\nthree", "one\ntwo\nTHREE\n");
    expect(types(ops)).toEqual(["equal", "equal", "remove", "add"]);
  });
});

describe("diffLines: correctness on random input", () => {
  test("A and B can both be rebuilt from the ops, and the diff is the shortest possible", () => {
    const rng = makeRng(42);
    for (let round = 0; round < 300; round++) {
      const alphabet = 1 + Math.floor(rng() * 8);
      const a = randomLines(rng, Math.floor(rng() * 30), alphabet);
      const b = randomLines(rng, Math.floor(rng() * 30), alphabet);
      const ops = diffLines(a, b);

      expect(rebuild(ops, ["equal", "remove"])).toEqual(a);
      expect(rebuild(ops, ["equal", "add"])).toEqual(b);

      const { added, removed } = summarize(ops);
      expect(added + removed).toBe(a.length + b.length - 2 * lcsLength(a, b));
    }
  });

  test("line numbers are consecutive on each side", () => {
    const rng = makeRng(7);
    for (let round = 0; round < 100; round++) {
      const a = randomLines(rng, Math.floor(rng() * 25), 5);
      const b = randomLines(rng, Math.floor(rng() * 25), 5);
      const ops = diffLines(a, b);
      expect(ops.filter((op) => op.aLine !== null).map((op) => op.aLine)).toEqual(a.map((_, i) => i + 1));
      expect(ops.filter((op) => op.bLine !== null).map((op) => op.bLine)).toEqual(b.map((_, i) => i + 1));
    }
  });

  test("removals always come before additions inside a change", () => {
    const rng = makeRng(99);
    for (let round = 0; round < 100; round++) {
      const ops = diffLines(randomLines(rng, 20, 4), randomLines(rng, 20, 4));
      for (let i = 1; i < ops.length; i++) {
        expect(ops[i - 1].type === "add" && ops[i].type === "remove").toBe(false);
      }
    }
  });
});

describe("diffLines: speed", () => {
  test("a 2,000-line file with 200 edited lines compares quickly", () => {
    const a = Array.from({ length: 2000 }, (_, i) => `line ${i}`);
    const b = [...a];
    for (let i = 0; i < 2000; i += 10) b[i] = `changed ${i}`;
    const started = Date.now();
    const ops = diffLines(a, b);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(summarize(ops)).toEqual({ added: 200, removed: 200, unchanged: 1800 });
  });
});

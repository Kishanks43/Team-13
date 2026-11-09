import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";
import { buildMerged, detectManualEdits, splitMerged } from "../src/engine/manualEdit.js";
import { seeded, pick } from "./helpers/seeded.js";

// S3-01: which conflict did a hand edit land in?

const A = "top\nA1\nA2\nmid\nA3\nend";
const B = "top\nB1\nmid\nB2\nB3\nend";

function setup(textA = A, textB = B, resolutions = {}, manualLines = {}) {
  const ops = diffText(textA, textB);
  const conflicts = findConflicts(ops);
  const built = buildMerged(ops, conflicts, resolutions, manualLines);
  return { ops, conflicts, built };
}

describe("splitMerged", () => {
  test("empty text is no lines, anything else splits on newlines", () => {
    expect(splitMerged("")).toEqual([]);
    expect(splitMerged("a")).toEqual(["a"]);
    expect(splitMerged("a\n\nb")).toEqual(["a", "", "b"]);
    expect(splitMerged("a\n")).toEqual(["a", ""]);
  });
});

describe("buildMerged", () => {
  test("gives the same text as buildMergedText for every normal status", () => {
    const { ops, conflicts } = setup();
    for (const status of ["open", "A", "B", "both"]) {
      const res = Object.fromEntries(conflicts.map((c) => [c.id, status]));
      expect(buildMerged(ops, conflicts, res).lines.join("\n")).toBe(buildMergedText(ops, conflicts, res));
    }
  });

  test("reports where each conflict sits", () => {
    const { built } = setup(A, B, { 1: "both", 2: "A" });
    expect(built.lines).toEqual(["top", "A1", "A2", "B1", "mid", "A3", "end"]);
    expect(built.segments).toEqual([
      { id: 1, start: 1, end: 4 },
      { id: 2, start: 5, end: 6 }
    ]);
  });

  test("a manual conflict uses the lines the user typed, or nothing if there are none", () => {
    const withLines = setup(A, B, { 1: "manual" }, { 1: ["mine"] });
    expect(withLines.built.lines.slice(0, 3)).toEqual(["top", "mine", "mid"]);
    const without = setup(A, B, { 1: "manual" });
    expect(without.built.lines.slice(0, 2)).toEqual(["top", "mid"]);
  });
});

describe("detectManualEdits", () => {
  test("no change means no edits", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const result = detectManualEdits(built.lines, built.lines.join("\n"), built.segments);
    expect(result.edits).toEqual([]);
    expect(result.segments).toBe(built.segments);
  });

  test("typing inside a resolved conflict marks it manual with the new lines", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const text = built.lines.join("\n").replace("A1", "A1 edited");
    const result = detectManualEdits(built.lines, text, built.segments);
    expect(result.edits).toEqual([{ id: 1, lines: ["A1 edited", "A2"] }]);
  });

  test("adding a line at the end of a conflict stays inside it", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const text = built.lines.join("\n").replace("A2\n", "A2\nextra\n");
    const result = detectManualEdits(built.lines, text, built.segments);
    expect(result.edits).toEqual([{ id: 1, lines: ["A1", "A2", "extra"] }]);
    // the later conflict moved down by one line
    expect(result.segments[1].start).toBe(built.segments[1].start + 1);
  });

  test("deleting every line of a conflict makes it manual with no lines", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const text = built.lines.join("\n").replace("A1\nA2\n", "");
    const result = detectManualEdits(built.lines, text, built.segments);
    expect(result.edits).toEqual([{ id: 1, lines: [] }]);
  });

  test("typing into an open conflict, which has no lines yet, marks it manual", () => {
    const { built } = setup(A, B); // all open
    const lines = [...built.lines];
    lines.splice(built.segments[0].start, 0, "typed here");
    const result = detectManualEdits(built.lines, lines.join("\n"), built.segments);
    expect(result.edits).toEqual([{ id: 1, lines: ["typed here"] }]);
  });

  test("an edit in unchanged lines marks nothing", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const text = built.lines.join("\n").replace("top", "TOP");
    const result = detectManualEdits(built.lines, text, built.segments);
    expect(result.edits).toEqual([]);
    expect(result.segments.map((s) => [s.start, s.end])).toEqual(built.segments.map((s) => [s.start, s.end]));
  });

  test("a line added just above a conflict does not mark it, and its lines move down", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const lines = [...built.lines];
    lines.splice(built.segments[0].start, 0, "new line above");
    const result = detectManualEdits(built.lines, lines.join("\n"), built.segments);
    expect(result.edits).toEqual([]);
    expect(result.segments[0].start).toBe(built.segments[0].start + 1);
  });

  test("an edit across two conflicts marks both and keeps the lines they had", () => {
    const { built } = setup(A, B, { 1: "A", 2: "B" });
    // replace everything from A2 down to B2 with one line
    const lines = built.lines.slice(0, 2).concat(["one big edit"], built.lines.slice(built.segments[1].end));
    const result = detectManualEdits(built.lines, lines.join("\n"), built.segments);
    expect(result.edits.map((e) => e.id)).toEqual([1, 2]);
    for (const edit of result.edits) {
      const seg = built.segments.find((s) => s.id === edit.id);
      expect(edit.lines).toEqual(built.lines.slice(seg.start, seg.end));
    }
  });

  test("clearing the whole pane marks every conflict that had lines", () => {
    const { built } = setup(A, B, { 1: "A", 2: "A" });
    const result = detectManualEdits(built.lines, "", built.segments);
    expect(result.edits.map((e) => e.id)).toEqual([1, 2]);
    expect(result.edits.map((edit) => edit.lines)).toEqual([[], []]);
    expect(result.newLines).toEqual([]);
    expect(result.wholePaneReplacement).toBe(true);
    expect(result.segments).toEqual([
      { id: 1, start: 0, end: 0 },
      { id: 2, start: 0, end: 0 }
    ]);
  });
});

const WORDS = ["a", "b", "c", "d", "", "  x", "y y"];

function randomSetup(rand) {
  const mk = () => Array.from({ length: Math.floor(rand() * 10) }, () => pick(rand, WORDS)).join("\n");
  const ops = diffText(mk(), mk());
  const conflicts = findConflicts(ops);
  const res = Object.fromEntries(conflicts.map((c) => [c.id, pick(rand, ["open", "A", "B", "both"])]));
  return { ops, conflicts, res };
}

describe("property: edits inside one conflict rebuild exactly", () => {
  test("random versions, random edits inside a conflict, repeated", () => {
    const rand = seeded(31337);
    let checked = 0;
    for (let round = 0; round < 300; round++) {
      const { ops, conflicts, res } = randomSetup(rand);
      if (conflicts.length === 0) continue;
      let manualLines = {};
      let built = buildMerged(ops, conflicts, res, manualLines);

      for (let step = 0; step < 6; step++) {
        const seg = pick(rand, built.segments);
        const empty = seg.start === seg.end;
        const at = empty ? seg.start : seg.start + 1 + Math.floor(rand() * (seg.end - seg.start));
        const remove = Math.floor(rand() * (seg.end - at + 1));
        const add = Array.from({ length: Math.floor(rand() * 3) }, () => `new ${pick(rand, WORDS)}`);
        const lines = [...built.lines];
        lines.splice(at, remove, ...add);

        const result = detectManualEdits(built.lines, lines.join("\n"), built.segments);
        if (lines.join("\n") === built.lines.join("\n")) {
          expect(result.edits).toEqual([]);
        } else {
          expect(result.edits.map((e) => e.id)).toEqual([seg.id]);
          manualLines = { ...manualLines, [seg.id]: result.edits[0].lines };
          res[seg.id] = "manual";
          checked++;
        }
        built = buildMerged(ops, conflicts, res, manualLines);
        // One blank line and no lines at all are the same pane text, so compare the text.
        expect(built.lines.join("\n")).toBe(result.newLines.join("\n"));
        if (built.lines.length === result.newLines.length) {
          expect(built.lines).toEqual(result.newLines);
          expect(built.segments).toEqual(result.segments);
        }
      }
    }
    expect(checked).toBeGreaterThan(200);
  });
});

describe("property: any edit leaves valid, ordered, non-overlapping segments", () => {
  test("random versions and arbitrary edits", () => {
    const rand = seeded(8675309);
    for (let round = 0; round < 300; round++) {
      const { ops, conflicts, res } = randomSetup(rand);
      let built = buildMerged(ops, conflicts, res);
      for (let step = 0; step < 6; step++) {
        const lines = [...built.lines];
        const at = Math.floor(rand() * (lines.length + 1));
        const remove = Math.floor(rand() * Math.min(4, lines.length - at + 1));
        const add = Array.from({ length: Math.floor(rand() * 3) }, () => `new ${pick(rand, WORDS)}`);
        lines.splice(at, remove, ...add);
        const text = lines.join("\n");

        const result = detectManualEdits(built.lines, text, built.segments);
        expect(result.newLines).toEqual(splitMerged(text));
        let last = 0;
        for (const seg of result.segments) {
          expect(seg.start).toBeGreaterThanOrEqual(last);
          expect(seg.end).toBeGreaterThanOrEqual(seg.start);
          expect(seg.end).toBeLessThanOrEqual(result.newLines.length);
          last = seg.end;
        }
        built = { lines: result.newLines, segments: result.segments };
      }
    }
  });
});

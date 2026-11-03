import { describe, test, expect } from "@jest/globals";
import { init } from "../src/app.js";
import { diffLines, diffText, splitLines } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedLines, buildMergedText, linesForResolution } from "../src/engine/merge.js";
import { createSession } from "../src/engine/session.js";
import { createFakeDoc, actionClick, selectClick } from "./helpers/fakeDom.js";
import { seeded, pick } from "./helpers/seeded.js";

// S2-06: Version A and Version B stay byte-for-byte unchanged by any merge edit.

const TRICKY = [
  "",
  "  indented",
  "tab\there",
  "trailing space ",
  "unicode ✓ é 😀",
  "\uFEFFbyte order mark",
  "<script>alert(1)</script>",
  "x".repeat(5000)
];

// [name, textA, textB]
const FIXTURES = [
  ["separate edits", "one\ntwo\nthree\nfour\nfive", "ONE\ntwo\nthree\nFOUR\nfive"],
  ["same-line conflict", "alpha\nbeta\ngamma", "alpha\nBETA\ngamma"],
  ["deleted vs modified", "a\nb\nc\nd", "a\nB\nd"],
  ["CRLF in A, LF in B", "a\r\nb\r\nc\r\n", "a\nB\nc\n"],
  ["lone CR line endings", "a\rb\rc", "a\rX\rc"],
  ["trailing newline only in A", "a\nb\n", "a\nc"],
  ["blank lines and whitespace", "a\n\n  \n\tb\n", "a\n\n \n\tB\n"],
  ["unicode, BOM and long lines", `${TRICKY[4]}\n${TRICKY[5]}\n${TRICKY[7]}`, `${TRICKY[4]}\n${TRICKY[5]}x\n${TRICKY[7]}y`],
  ["empty A", "", "new\nlines"],
  ["empty B", "old\nlines", ""],
  ["both empty", "", ""],
  ["identical", "same\nsame\n", "same\nsame\n"],
  ["fully different", "a\nb\nc", "x\ny\nz"]
];

// Wraps a pane's value so we can see whether the app ever writes to it.
// Writes made through type() are the "user typing" and are not counted.
function guardPane(element, initial = "") {
  let stored = initial;
  let typing = false;
  let appWrites = 0;
  Object.defineProperty(element, "value", {
    configurable: true,
    get: () => stored,
    set: (next) => {
      if (!typing) appWrites++;
      stored = next;
    }
  });
  return {
    type(text) {
      typing = true;
      element.value = text;
      typing = false;
    },
    get appWrites() {
      return appWrites;
    }
  };
}

function setupPage(textA, textB) {
  const doc = createFakeDoc();
  const timers = new Map();
  let nextTimer = 1;
  const app = init(doc, {
    setTimer: (fn) => {
      timers.set(nextTimer, fn);
      return nextTimer++;
    },
    clearTimer: (id) => timers.delete(id)
  });
  const a = guardPane(doc.elements["pane-a"]);
  const b = guardPane(doc.elements["pane-b"]);
  a.type(textA);
  b.type(textB);
  doc.elements["compare-btn"].dispatch("click");
  const runTimers = () => {
    for (const [id, fn] of [...timers]) {
      timers.delete(id);
      fn();
    }
  };
  return { doc, app, a, b, runTimers };
}

// Compares the text itself and every UTF-16 code unit, so even an invisible
// change (a line ending, a BOM, a trailing space) is caught.
const codeUnits = (text) => Array.from({ length: text.length }, (_, i) => text.charCodeAt(i));

function sameBytes(actual, expected) {
  expect(actual).toBe(expected);
  expect(codeUnits(actual)).toEqual(codeUnits(expected));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

describe("S2-06: the page never alters Version A or Version B", () => {
  test.each(FIXTURES)("%s: resolving every conflict in every way leaves both panes identical", (_name, textA, textB) => {
    const { doc, app, a, b } = setupPage(textA, textB);
    const list = doc.elements["conflict-list"];
    const count = app.session.getState().conflicts.length;
    for (let id = 1; id <= count; id++) {
      for (const action of ["A", "B", "both", "A"]) {
        list.dispatch("click", actionClick(action, id));
        list.dispatch("click", selectClick(id));
        sameBytes(doc.elements["pane-a"].value, textA);
        sameBytes(doc.elements["pane-b"].value, textB);
      }
    }
    expect(a.appWrites).toBe(0);
    expect(b.appWrites).toBe(0);
  });

  test.each(FIXTURES)("%s: editing the merged pane by hand never writes back", (_name, textA, textB) => {
    const { doc, a, b } = setupPage(textA, textB);
    const merged = doc.elements["merged-result"];
    const edits = ["", textA, textB, "totally new\ntext\n", "line\r\nwith\r\ncrlf", TRICKY[4], `${textA}\n${textB}`];
    for (const edit of edits) {
      merged.value = edit;
      merged.dispatch("input");
      sameBytes(doc.elements["pane-a"].value, textA);
      sameBytes(doc.elements["pane-b"].value, textB);
    }
    expect(a.appWrites).toBe(0);
    expect(b.appWrites).toBe(0);
  });

  test("re-comparing after merged edits leaves both panes identical", () => {
    const { doc, a, b } = setupPage("a\nb\nc", "a\nB\nc");
    doc.elements["merged-result"].value = "my own text";
    doc.elements["merged-result"].dispatch("input");
    for (let i = 0; i < 5; i++) doc.elements["compare-btn"].dispatch("click");
    sameBytes(doc.elements["pane-a"].value, "a\nb\nc");
    sameBytes(doc.elements["pane-b"].value, "a\nB\nc");
    expect(a.appWrites + b.appWrites).toBe(0);
  });

  test("the live re-diff after the first Compare never writes to the panes", () => {
    const { doc, a, b, runTimers } = setupPage("a\nb\nc", "a\nB\nc");
    // An input event with unchanged text still schedules the live re-diff.
    doc.elements["pane-a"].dispatch("input");
    doc.elements["pane-b"].dispatch("input");
    runTimers();
    sameBytes(doc.elements["pane-a"].value, "a\nb\nc");
    sameBytes(doc.elements["pane-b"].value, "a\nB\nc");
    expect(a.appWrites + b.appWrites).toBe(0);
  });

  test("only the merged pane changes when a resolution is chosen", () => {
    const { doc } = setupPage("top\nA1\nend", "top\nB1\nend");
    const before = { a: doc.elements["pane-a"].value, b: doc.elements["pane-b"].value };
    doc.elements["conflict-list"].dispatch("click", actionClick("both", 1));
    expect(doc.elements["merged-result"].value).toBe("top\nA1\nB1\nend");
    expect(doc.elements["pane-a"].value).toBe(before.a);
    expect(doc.elements["pane-b"].value).toBe(before.b);
  });

  test("property: many random resolutions, selections, merged edits and re-compares", () => {
    const rand = seeded(2026);
    for (let round = 0; round < 150; round++) {
      const lines = () =>
        Array.from({ length: Math.floor(rand() * 9) }, () =>
          rand() < 0.5 ? pick(rand, TRICKY.slice(0, 7)) : `line ${Math.floor(rand() * 4)}`
        );
      const textA = lines().join(pick(rand, ["\n", "\r\n", "\r"])) + (rand() < 0.5 ? "\n" : "");
      const textB = lines().join("\n") + (rand() < 0.5 ? "\n" : "");

      const { doc, app, a, b, runTimers } = setupPage(textA, textB);
      const list = doc.elements["conflict-list"];

      for (let step = 0; step < 25; step++) {
        const count = app.session.getState().conflicts.length;
        const roll = rand();
        if (count > 0 && roll < 0.4) {
          list.dispatch("click", actionClick(pick(rand, ["A", "B", "both"]), 1 + Math.floor(rand() * count)));
        } else if (count > 0 && roll < 0.55) {
          list.dispatch("click", selectClick(1 + Math.floor(rand() * count)));
        } else if (roll < 0.8) {
          doc.elements["merged-result"].value = `edit ${step} ${pick(rand, TRICKY)}`;
          doc.elements["merged-result"].dispatch("input");
        } else if (roll < 0.9) {
          doc.elements["compare-btn"].dispatch("click");
        } else {
          doc.elements["pane-a"].dispatch("input");
          runTimers();
        }
        sameBytes(doc.elements["pane-a"].value, textA);
        sameBytes(doc.elements["pane-b"].value, textB);
      }
      expect(a.appWrites).toBe(0);
      expect(b.appWrites).toBe(0);
    }
  });
});

describe("S2-06: the merge engine never alters its inputs", () => {
  const statuses = ["open", "A", "B", "both", "manual"];

  test.each(FIXTURES)("%s: building merged text from frozen data never throws or changes it", (_name, textA, textB) => {
    const ops = deepFreeze(diffText(textA, textB));
    const conflicts = deepFreeze(findConflicts(ops));
    const snapshot = JSON.stringify({ ops, conflicts });
    const combos = conflicts.length <= 4 ? statuses.length ** conflicts.length : 0;
    for (let n = 0; n < combos; n++) {
      const resolutions = {};
      let rest = n;
      for (const conflict of conflicts) {
        resolutions[conflict.id] = statuses[rest % statuses.length];
        rest = Math.floor(rest / statuses.length);
      }
      expect(() => buildMergedText(ops, conflicts, resolutions)).not.toThrow();
    }
    expect(JSON.stringify({ ops, conflicts })).toBe(snapshot);
  });

  test("diffing never changes the line arrays it is given", () => {
    const a = Object.freeze(["a", "b", "c"]);
    const b = Object.freeze(["a", "B", "c", "d"]);
    expect(() => diffLines(a, b)).not.toThrow();
    expect(a).toEqual(["a", "b", "c"]);
    expect(b).toEqual(["a", "B", "c", "d"]);
  });

  test("a loaded session does not change the ops it was given", () => {
    const ops = deepFreeze(diffText("a\nb\nc", "a\nB\nc"));
    const snapshot = JSON.stringify(ops);
    const session = createSession();
    session.load(ops);
    session.resolve(1, "both");
    session.select(1);
    session.resolve(1, "A");
    expect(JSON.stringify(ops)).toBe(snapshot);
  });

  test("changing the merged lines afterwards cannot reach the conflicts or ops", () => {
    const ops = diffText("top\nA1\nA2\nend", "top\nB1\nend");
    const conflicts = findConflicts(ops);
    const snapshot = JSON.stringify({ ops, conflicts });
    const lines = buildMergedLines(ops, conflicts, { 1: "both" });
    lines.push("junk");
    lines[1] = "changed";
    const taken = linesForResolution(conflicts[0], "both");
    taken.push("junk");
    taken[0] = "changed";
    expect(JSON.stringify({ ops, conflicts })).toBe(snapshot);
  });

  test("splitting text never changes the original string", () => {
    const text = "a\r\nb\rc\n";
    const copy = `${text}`;
    splitLines(text);
    sameBytes(text, copy);
  });

  test("the same inputs always give the same diff, conflicts and merge", () => {
    const [, textA, textB] = FIXTURES[0];
    const first = buildMergedText(diffText(textA, textB), findConflicts(diffText(textA, textB)), { 1: "both" });
    const second = buildMergedText(diffText(textA, textB), findConflicts(diffText(textA, textB)), { 1: "both" });
    expect(second).toBe(first);
  });
});

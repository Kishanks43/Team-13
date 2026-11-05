import { describe, test, expect } from "@jest/globals";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";
import { createSession } from "../src/engine/session.js";
import { renderConflictList } from "../src/ui/conflictList.js";
import { buildRows, renderSideBySide } from "../src/ui/diffView.js";

// S3-03: two 2,000-line files must compare in 2 seconds or less. The real timings are
// tens of milliseconds, so this limit leaves plenty of room for a slow CI machine.
const LINES = 2000;
const LIMIT_MS = 2000;

const make = (line) => Array.from({ length: LINES }, (_, i) => line(i)).join("\n");

// [name, textA, textB]
const SCENARIOS = [
  ["identical files", make((i) => `line ${i}`), make((i) => `line ${i}`)],
  ["every other line changed", make((i) => `line ${i}`), make((i) => (i % 2 ? `changed ${i}` : `line ${i}`))],
  ["every line different", make((i) => `a ${i}`), make((i) => `b ${i}`)],
  ["one file in reverse order", make((i) => `line ${i}`), make((i) => `line ${LINES - 1 - i}`)],
  ["lines repeated over and over", make((i) => `x${i % 3}`), make((i) => `x${(i + 1) % 3}`)],
  ["blank lines everywhere", make((i) => (i % 2 ? "" : `l${i}`)), make((i) => (i % 3 ? "" : `m${i}`))],
  ["Windows line endings", make((i) => `line ${i}`).replace(/\n/g, "\r\n"), make((i) => (i % 5 ? `line ${i}` : `edit ${i}`))],
  ["one empty file", "", make((i) => `line ${i}`)],
  ["very long lines", make((i) => `${"x".repeat(500)} ${i}`), make((i) => `${"x".repeat(500)} ${i % 7 ? i : "y"}`)]
];

function timed(work) {
  const start = Date.now();
  const result = work();
  return { result, ms: Date.now() - start };
}

describe("S3-03: 2,000-line files compare in 2 seconds or less", () => {
  test.each(SCENARIOS)("%s: diff, conflicts and merged text", (_name, textA, textB) => {
    const { ms } = timed(() => {
      const ops = diffText(textA, textB);
      const conflicts = findConflicts(ops);
      return buildMergedText(ops, conflicts, {});
    });
    expect(ms).toBeLessThanOrEqual(LIMIT_MS);
  });

  test.each(SCENARIOS)("%s: the whole load into the session, list and diff view", (_name, textA, textB) => {
    const { ms } = timed(() => {
      const ops = diffText(textA, textB);
      const session = createSession();
      session.load(ops);
      const state = session.getState();
      renderConflictList(state.conflicts, state.resolutions, null);
      renderSideBySide(buildRows(ops));
    });
    expect(ms).toBeLessThanOrEqual(LIMIT_MS);
  });

  test("the answers are still right at this size", () => {
    const ops = diffText(SCENARIOS[1][1], SCENARIOS[1][2]);
    const conflicts = findConflicts(ops);
    expect(conflicts).toHaveLength(LINES / 2);
    expect(ops.filter((op) => op.type === "equal")).toHaveLength(LINES / 2);
    expect(buildMergedText(ops, conflicts, {}).split("\n")).toHaveLength(LINES / 2);
  });

  test("resolving every one of 1,000 conflicts stays fast", () => {
    const [, textA, textB] = SCENARIOS[1];
    const session = createSession();
    session.load(diffText(textA, textB));
    const { ms } = timed(() => {
      for (let id = 1; id <= 1000; id++) session.resolve(id, id % 2 ? "A" : "B");
    });
    expect(ms).toBeLessThanOrEqual(LIMIT_MS);
    expect(session.getState().progress.remaining).toBe(0);
  });
});

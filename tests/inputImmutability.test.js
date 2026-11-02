import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildMergedText } from "../src/engine/merge.js";

describe("S2-06: input panes remain untouched by merge edits", () => {
  function makeFixture() {
    const versionA = "const name = 'A';\nconsole.log(name);\nfinish();";
    const versionB = "const name = 'B';\nconsole.log(name);\nfinish();";
    const paneA = { value: versionA };
    const paneB = { value: versionB };
    return { versionA, versionB, paneA, paneB };
  }

  test("accepting A, B and Both never changes either input pane", () => {
    const { versionA, versionB, paneA, paneB } = makeFixture();
    const ops = diffText(paneA.value, paneB.value);
    const conflicts = findConflicts(ops);
    const originalA = paneA.value;
    const originalB = paneB.value;

    for (const status of ["A", "B", "both"]) {
      const mergedText = buildMergedText(ops, conflicts, { 1: status });
      expect(typeof mergedText).toBe("string");
      expect(paneA.value).toBe(originalA);
      expect(paneB.value).toBe(originalB);
    }
    expect(paneA.value).toBe(versionA);
    expect(paneB.value).toBe(versionB);
  });

  test("typing and replacing the merged result is independent of input values", () => {
    const { versionA, versionB, paneA, paneB } = makeFixture();
    const ops = diffText(paneA.value, paneB.value);
    const conflicts = findConflicts(ops);
    const mergedPane = { value: buildMergedText(ops, conflicts, { 1: "A" }) };
    const originalA = paneA.value;
    const originalB = paneB.value;

    mergedPane.value += "\n// user-authored line";
    mergedPane.value = "entirely hand-edited merged content";

    expect(mergedPane.value).toBe("entirely hand-edited merged content");
    expect(paneA.value).toBe(originalA);
    expect(paneB.value).toBe(originalB);
  });

  test("repeated merge operations do not mutate source strings or diff operations", () => {
    const { paneA, paneB } = makeFixture();
    const ops = diffText(paneA.value, paneB.value);
    const snapshot = structuredClone(ops);
    const conflicts = findConflicts(ops);

    buildMergedText(ops, conflicts, { 1: "both" });
    buildMergedText(ops, conflicts, { 1: "B" });

    expect(ops).toEqual(snapshot);
    expect(paneA.value).toContain("'A'");
    expect(paneB.value).toContain("'B'");
  });
});
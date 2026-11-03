import { describe, test, expect } from "@jest/globals";
import { describeSide, renderConflictList } from "../src/ui/conflictList.js";
import { findConflictsInText } from "../src/engine/conflicts.js";

describe("describeSide", () => {
  test("describes a single line, a range and an empty side", () => {
    expect(describeSide(4, ["x"])).toBe("line 4");
    expect(describeSide(3, ["x", "y", "z"])).toBe("lines 3-5");
    expect(describeSide(6, [])).toBe("no lines (before line 6)");
  });
});

describe("renderConflictList", () => {
  const conflicts = findConflictsInText("a\nb\nc\nd\ne", "a\nB\nc\nD\ne");

  test("shows a friendly message when there are no conflicts", () => {
    expect(renderConflictList([], {}, null)).toContain("No conflicts.");
  });

  test("renders one select button per conflict, with data-conflict-id", () => {
    const html = renderConflictList(conflicts, {}, null);
    expect(html).toContain('data-conflict-id="1"');
    expect(html).toContain('data-conflict-id="2"');
  });

  test("renders Accept A, B and Both buttons for each conflict", () => {
    const html = renderConflictList(conflicts, {}, null);
    for (const id of [1, 2]) {
      for (const action of ["A", "B", "both"]) {
        expect(html).toContain(`data-action="${action}" data-id="${id}"`);
      }
    }
  });

  test("shows each conflict's status: Open, A, B or Both", () => {
    const html = renderConflictList(conflicts, { 1: "A" }, null);
    expect(html).toContain(">Open<");
    expect(html).toContain(">A<");
    const both = renderConflictList(conflicts, { 1: "both", 2: "B" }, null);
    expect(both).toContain(">Both<");
    expect(both).toContain(">B<");
  });

  test("marks the selected conflict", () => {
    const html = renderConflictList(conflicts, {}, 2);
    expect(html).toContain("is-selected");
    expect(html.match(/is-selected/g)).toHaveLength(1);
    expect(html).toContain('aria-current="true"');
  });

  test("escapes anything that could come from user text", () => {
    const evil = [{ id: 1, type: '"><img src=x onerror=alert(1)>', aStart: 1, bStart: 1, aLines: ["x"], bLines: ["y"] }];
    const html = renderConflictList(evil, {}, null);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

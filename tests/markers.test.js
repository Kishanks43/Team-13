import { describe, test, expect } from "@jest/globals";
import {
  MARKER_START, MARKER_MIDDLE, MARKER_END, formatConflictBlock, countConflictMarkers, hasConflictMarkers
} from "../src/engine/markers.js";

describe("S3-04 markers", () => {
  test("block layout is start, A lines, middle, B lines, end", () => {
    expect(formatConflictBlock(["a1", "a2"], ["b1"])).toEqual(["<<<<<<< A", "a1", "a2", "=======", "b1", ">>>>>>> B"]);
  });
  test("empty sides still produce all three markers", () => {
    expect(formatConflictBlock([], [])).toEqual([MARKER_START, MARKER_MIDDLE, MARKER_END]);
  });
  test("counts complete blocks", () => {
    const text = ["x", ...formatConflictBlock(["a"], ["b"]), "y", ...formatConflictBlock([], ["c"])].join("\n");
    expect(countConflictMarkers(text)).toBe(2);
    expect(hasConflictMarkers(text)).toBe(true);
  });
  test("a lone ======= (Markdown underline) is not a conflict", () => {
    expect(hasConflictMarkers("Title\n=======\ntext")).toBe(false);
  });
  test("incomplete or out-of-order markers are not counted", () => {
    expect(hasConflictMarkers("<<<<<<< A\nfoo")).toBe(false);
    expect(hasConflictMarkers(">>>>>>> B\n=======\n<<<<<<< A")).toBe(false);
    expect(hasConflictMarkers("")).toBe(false);
  });
  test("works with CRLF text", () => {
    expect(hasConflictMarkers(formatConflictBlock(["a"], ["b"]).join("\r\n"))).toBe(true);
  });
});

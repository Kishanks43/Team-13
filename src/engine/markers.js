import { splitLines } from "./diff.js";

// S3-04: Git-style conflict markers for conflicts that are still open.
export const MARKER_START = "<<<<<<< A";
export const MARKER_MIDDLE = "=======";
export const MARKER_END = ">>>>>>> B";

export function formatConflictBlock(aLines, bLines) {
  return [MARKER_START, ...aLines, MARKER_MIDDLE, ...bLines, MARKER_END];
}

// Counts complete marker blocks (start, middle, end, in that order). A lone "=======" line,
// such as a Markdown heading underline, is not a conflict and is not counted.
export function countConflictMarkers(text) {
  let blocks = 0;
  let state = 0; // 0 outside, 1 after start, 2 after middle
  for (const line of splitLines(text)) {
    if (state === 0 && line === MARKER_START) state = 1;
    else if (state === 1 && line === MARKER_MIDDLE) state = 2;
    else if (state === 2 && line === MARKER_END) {
      blocks++;
      state = 0;
    }
  }
  return blocks;
}

// S3-07 can use this to treat leftover markers as unresolved.
export function hasConflictMarkers(text) {
  return countConflictMarkers(text) > 0;
}

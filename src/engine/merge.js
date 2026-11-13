import { getStatus } from "./resolutions.js";

// Canonical engine output includes accepted resolutions only. Git marker rows are
// added by the UI presentation layer, never by this pure merge builder. Manual
// content is supplied separately by the editable merged pane.
export function linesForResolution(conflict, status) {
  switch (status) {
    case "A":
      return [...conflict.aLines];
    case "B":
      return [...conflict.bLines];
    case "both":
      return [...conflict.aLines, ...conflict.bLines];
    case "open":
    case "manual":
    default:
      return [];
  }
}

// Equal lines are copied; each conflict contributes lines according to its resolution.
// Lines are joined with "\n" and no extra blank lines are added.
export function buildMergedLines(ops, conflicts, resolutions) {
  const lines = [];
  let i = 0;
  let c = 0;
  while (i < ops.length) {
    const conflict = conflicts[c];
    if (conflict && i === conflict.opStart) {
      lines.push(...linesForResolution(conflict, getStatus(resolutions, conflict.id)));
      i = conflict.opEnd;
      c++;
    } else {
      lines.push(ops[i].text);
      i++;
    }
  }
  return lines;
}

export function buildMergedText(ops, conflicts, resolutions) {
  return buildMergedLines(ops, conflicts, resolutions).join("\n");
}

const splitForScan = (text) => (text ? String(text).split(/\r\n|\n|\r/) : []);

// Only the markers this app writes are blocking. A source file may legitimately
// contain lines that start with "<<<<<<<" (for example a heredoc or a Git conflict
// from another tool), and those must not keep Apply Merge disabled forever.
const APP_START_LINE = /^<{7} A$/;
const APP_END_LINE = /^>{7} B$/;

// How many of the app's own conflict blocks are still marked in the text.
export function countConflictMarkers(text) {
  return splitForScan(text).filter((line) => APP_START_LINE.test(line)).length;
}

// True if any of the app's own start or end marker lines is left in the text.
// S3-07 uses this so a half-deleted block still counts as unresolved. A lone
// "=======" line is ignored, because it is a normal line in many files (for
// example under a Markdown heading).
export function hasConflictMarkers(text) {
  return splitForScan(text).some((line) => APP_START_LINE.test(line) || APP_END_LINE.test(line));
}

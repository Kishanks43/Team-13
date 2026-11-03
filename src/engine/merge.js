import { getStatus } from "./resolutions.js";

// Git-style markers shown for a conflict that is still open (S3-04):
//
//   <<<<<<< A
//   (A lines)
//   =======
//   (B lines)
//   >>>>>>> B
export const CONFLICT_MARKERS = Object.freeze({
  start: "<<<<<<< A",
  middle: "=======",
  end: ">>>>>>> B"
});

const START_LINE = /^<{7}(?: |$)/;
const END_LINE = /^>{7}(?: |$)/;

// The marker block for one conflict. Always a new array.
export function markerLines(conflict) {
  return [CONFLICT_MARKERS.start, ...conflict.aLines, CONFLICT_MARKERS.middle, ...conflict.bLines, CONFLICT_MARKERS.end];
}

// Lines a conflict contributes to the merged text for a given status.
// - open: the Git-style marker block (or nothing when options.markers is false)
// - A, B, both: the chosen lines, with no markers
// - manual: nothing here, because the hand-written text lives in the editable merged pane
export function linesForResolution(conflict, status, { markers = true } = {}) {
  switch (status) {
    case "A":
      return [...conflict.aLines];
    case "B":
      return [...conflict.bLines];
    case "both":
      return [...conflict.aLines, ...conflict.bLines];
    case "open":
      return markers ? markerLines(conflict) : [];
    default:
      return [];
  }
}

// Equal lines are copied; each conflict contributes lines according to its resolution.
// Lines are joined with "\n" and no extra blank lines are added.
export function buildMergedLines(ops, conflicts, resolutions, options = {}) {
  const lines = [];
  let i = 0;
  let c = 0;
  while (i < ops.length) {
    const conflict = conflicts[c];
    if (conflict && i === conflict.opStart) {
      lines.push(...linesForResolution(conflict, getStatus(resolutions, conflict.id), options));
      i = conflict.opEnd;
      c++;
    } else {
      lines.push(ops[i].text);
      i++;
    }
  }
  return lines;
}

export function buildMergedText(ops, conflicts, resolutions, options = {}) {
  return buildMergedLines(ops, conflicts, resolutions, options).join("\n");
}

const splitForScan = (text) => String(text).split(/\r\n|\n|\r/);

// How many conflict blocks are still marked in the text (one per "<<<<<<<" line).
export function countConflictMarkers(text) {
  return splitForScan(text).filter((line) => START_LINE.test(line)).length;
}

// True if any start or end marker line is left in the text. S3-07 uses this so a
// half-deleted block still counts as unresolved. A lone "=======" line is ignored,
// because it is a normal line in many files (for example under a Markdown heading).
export function hasConflictMarkers(text) {
  return splitForScan(text).some((line) => START_LINE.test(line) || END_LINE.test(line));
}

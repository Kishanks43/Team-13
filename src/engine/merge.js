import { getStatus } from "./resolutions.js";

// Lines a conflict contributes to the merged text for a given status.
// open and manual contribute nothing here: open is undecided, and manual text
// lives in the editable merged pane.
export function linesForResolution(conflict, status) {
  switch (status) {
    case "A":
      return [...conflict.aLines];
    case "B":
      return [...conflict.bLines];
    case "both":
      return [...conflict.aLines, ...conflict.bLines];
    case "open":
      return [
        "<<<<<<< A",
        ...conflict.aLines,
        "=======",
        ...conflict.bLines,
        ">>>>>>> B"
      ];
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

const START_LINE = /^<{7}(?: |$)/;
const END_LINE = /^>{7}(?: |$)/;

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

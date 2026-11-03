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

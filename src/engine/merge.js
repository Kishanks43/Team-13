import { formatConflictBlock } from "./markers.js";
import { getStatus } from "./resolutions.js";

// Lines contributed by one conflict, given its status.
// Open conflicts (and manual ones with no stored text) show Git-style markers.
export function conflictLines(conflict, status, manualLines) {
  if (status === "A") return conflict.aLines;
  if (status === "B") return conflict.bLines;
  if (status === "both") return [...conflict.aLines, ...conflict.bLines];
  if (status === "manual" && Array.isArray(manualLines)) return manualLines;
  return formatConflictBlock(conflict.aLines, conflict.bLines);
}

export function buildMergedLines(ops, conflicts, resolutions, manualLines = {}) {
  const lines = [];
  let i = 0;
  for (const conflict of conflicts) {
    for (; i < conflict.opStart; i++) lines.push(ops[i].text);
    const status = getStatus(resolutions, conflict.id);
    lines.push(...conflictLines(conflict, status, manualLines[conflict.id]));
    i = conflict.opEnd;
  }
  for (; i < ops.length; i++) lines.push(ops[i].text);
  return lines;
}

// Joined with LF and no trailing newline, so identical inputs merge to the same text.
export function buildMergedText(ops, conflicts, resolutions, manualLines = {}) {
  return buildMergedLines(ops, conflicts, resolutions, manualLines).join("\n");
}

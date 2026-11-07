import { getStatus } from "./resolutions.js";
import { linesForResolution } from "./merge.js";

// Hand edits in the Merged Result pane.
//
// buildMerged works like buildMergedText, but it also reports where each conflict sits in the
// merged lines, and a conflict with the "manual" status contributes the lines the user typed.
// detectManualEdits compares the pane text before and after an edit and says which conflicts the
// edit touched, so the page can mark them "manual".

export function splitMerged(text) {
  return text === "" ? [] : text.split("\n");
}

// Returns { lines, segments }. segments[i] = { id, start, end } is the range of merged lines
// (end is exclusive) that conflict `id` currently occupies. manualLines is { [id]: string[] }.
export function buildMerged(ops, conflicts, resolutions, manualLines = {}) {
  const lines = [];
  const segments = [];
  let i = 0;
  let c = 0;
  while (i < ops.length) {
    const conflict = conflicts[c];
    if (conflict && i === conflict.opStart) {
      const status = getStatus(resolutions, conflict.id);
      const own =
        status === "manual" && Array.isArray(manualLines[conflict.id])
          ? manualLines[conflict.id]
          : linesForResolution(conflict, status);
      const start = lines.length;
      lines.push(...own);
      segments.push({ id: conflict.id, start, end: lines.length });
      i = conflict.opEnd;
      c++;
    } else {
      lines.push(ops[i].text);
      i++;
    }
  }
  return { lines, segments };
}

// oldLines/segments describe the pane before the edit; newText is the pane text now.
// Returns { newLines, segments, edits } where edits is [{ id, lines }]: the conflicts to mark
// manual and the lines each one now holds.
//
// An edit that stays inside one conflict's lines (typing, deleting, adding a line at its end)
// gives that conflict the new lines. An edit that reaches across several conflicts or into
// unchanged lines marks the conflicts it overlaps as manual but keeps the lines they had, so
// the text can always be rebuilt without repeating anything.
export function detectManualEdits(oldLines, newText, segments) {
  const newLines = splitMerged(newText);
  if (oldLines.join("\n") === newText) return { newLines, segments, edits: [] };

  let p = 0;
  while (p < oldLines.length && p < newLines.length && oldLines[p] === newLines[p]) p++;
  let s = 0;
  while (
    s < oldLines.length - p &&
    s < newLines.length - p &&
    oldLines[oldLines.length - 1 - s] === newLines[newLines.length - 1 - s]
  ) {
    s++;
  }
  const oe = oldLines.length - s; // old lines [p, oe) were replaced by new lines [p, ne)
  const ne = newLines.length - s;
  const delta = ne - oe;
  const insertion = p === oe;

  const contained = segments.find((seg) => {
    if (seg.start === seg.end) return insertion && p === seg.start;
    if (insertion && p === seg.start) return false; // a line added just above the conflict
    return seg.start <= p && oe <= seg.end;
  });

  const edits = [];
  if (contained) {
    edits.push({ id: contained.id, lines: newLines.slice(contained.start, contained.end + delta) });
  } else if (!insertion) {
    for (const seg of segments) {
      if (seg.end > seg.start && seg.start < oe && seg.end > p) {
        edits.push({ id: seg.id, lines: oldLines.slice(seg.start, seg.end) });
      }
    }
  }

  // Move every segment to its place in the new text. Segments stay in order and never overlap,
  // even when an edit swallowed the lines between two of them.
  let last = 0;
  const next = segments.map((seg) => {
    let start;
    let end;
    if (seg === contained) {
      start = seg.start;
      end = seg.end + delta;
    } else if (insertion) {
      start = seg.start >= p ? seg.start + delta : seg.start;
      end = seg.end > p ? seg.end + delta : seg.end;
    } else {
      start = seg.start <= p ? seg.start : seg.start >= oe ? seg.start + delta : p;
      end = seg.end <= p ? seg.end : seg.end >= oe ? seg.end + delta : ne;
    }
    start = Math.max(start, last);
    end = Math.max(end, start);
    last = end;
    return { id: seg.id, start, end };
  });

  return { newLines, segments: next, edits };
}

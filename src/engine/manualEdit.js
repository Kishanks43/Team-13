import { getStatus } from "./resolutions.js";
import { linesForResolution } from "./merge.js";
import { diffLines } from "./diff.js";

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

// Marker lines are presentation scaffolding, not user-authored merged content.
export function stripGitConflictMarkerLines(lines) {
  return lines.filter((line) => line !== "<<<<<<< A" && line !== "=======" && line !== ">>>>>>> B");
}

// Decorate a canonical merge model without changing its line or segment data.
export function decorateMergedModelWithGitConflictMarkers(lines, segments, conflicts, resolutions) {
  const conflictById = new Map(conflicts.map((conflict) => [conflict.id, conflict]));
  const at = new Map();
  const displayedSegments = [];
  let markerOffset = 0;

  for (const segment of segments) {
    const conflict = conflictById.get(segment.id);
    const open = getStatus(resolutions, segment.id) === "open";
    const start = segment.start + markerOffset;
    const markerBlock = open
      ? ["<<<<<<< A", ...conflict.aLines, "=======", ...conflict.bLines, ">>>>>>> B"]
      : [];
    if (open) at.set(segment.start, [...(at.get(segment.start) || []), ...markerBlock]);
    displayedSegments.push({
      id: segment.id,
      start,
      end: segment.end + markerOffset + markerBlock.length,
      ...(open ? { markers: true } : {})
    });
    markerOffset += markerBlock.length;
  }

  const displayed = [];
  for (let index = 0; index <= lines.length; index++) {
    if (at.has(index)) displayed.push(...at.get(index));
    if (index < lines.length) displayed.push(lines[index]);
  }
  return { lines: displayed, segments: displayedSegments };
}

export function buildMergedWithMarkers(ops, conflicts, resolutions, manualLines = {}) {
  const base = buildMerged(ops, conflicts, resolutions, manualLines);
  return decorateMergedModelWithGitConflictMarkers(base.lines, base.segments, conflicts, resolutions);
}

// Convert displayed lines back into the canonical merge model. Open conflict blocks
// are display-only and are removed entirely; a conflict just marked Manual keeps its
// edited contents while only the three marker-control lines are removed.
export function normalizeDisplayedMerge(lines, segments, _conflicts, resolutions) {
  const canonicalLines = [];
  const canonicalSegments = [];
  let cursor = 0;

  for (const segment of segments) {
    canonicalLines.push(...lines.slice(cursor, segment.start));
    const start = canonicalLines.length;
    const isOpenMarkerBlock = segment.markers && getStatus(resolutions, segment.id) === "open";
    if (!isOpenMarkerBlock) {
      canonicalLines.push(...stripGitConflictMarkerLines(lines.slice(segment.start, segment.end)));
    }
    canonicalSegments.push({ id: segment.id, start, end: canonicalLines.length });
    cursor = segment.end;
  }
  canonicalLines.push(...lines.slice(cursor));
  return { lines: canonicalLines, segments: canonicalSegments };
}

// oldLines/segments describe the pane before the edit; newText is the pane text now.
// Returns { newLines, segments, edits } where edits is [{ id, lines }]: the conflicts to mark
// manual and the lines each one now holds.
//
// An edit that stays inside one conflict's lines (typing, deleting, adding a line at its end)
// gives that conflict the new lines. An edit that reaches across several conflicts or into
// unchanged lines marks the conflicts it overlaps as manual but keeps the lines they had, so
// the text can always be rebuilt without repeating anything.
export function detectManualEdits(oldLines, newText, segments, { markerInsertionIsManual = false } = {}) {
  const newLines = splitMerged(newText);
  if (oldLines.join("\n") === newText) return { newLines, segments, edits: [] };

  // Work with each changed run independently. A common-prefix/common-suffix scan
  // collapses two distant edits (for example, one in a conflict and one in an
  // unchanged footer) into one large edit and can incorrectly mark intervening
  // conflicts as Manual.
  const ops = diffLines(oldLines, newLines);
  const regions = [];
  let oldAt = 0;
  let newAt = 0;
  let index = 0;
  while (index < ops.length) {
    if (ops[index].type === "equal") {
      oldAt++;
      newAt++;
      index++;
      continue;
    }
    const oldStart = oldAt;
    const newStart = newAt;
    while (index < ops.length && ops[index].type !== "equal") {
      if (ops[index].type === "remove") oldAt++;
      else newAt++;
      index++;
    }
    regions.push({ oldStart, oldEnd: oldAt, newStart, newEnd: newAt, delta: (newAt - newStart) - (oldAt - oldStart) });
  }

  const wholePaneReplacement = oldLines.length > 0 && regions.length === 1 &&
    regions[0].oldStart === 0 && regions[0].oldEnd === oldLines.length;
  if (wholePaneReplacement) {
    const emptySegments = segments.map((segment) => ({ id: segment.id, start: 0, end: 0 }));
    return { newLines, segments: emptySegments, edits: [], wholePaneReplacement: true };
  }
  const containedBySegment = new Map(segments.map((segment) => [segment.id, []]));
  const modeBySegment = new Map();
  for (const region of regions) {
    const insertion = region.oldStart === region.oldEnd;
    const hits = segments.filter((segment) => {
      if (insertion) {
        if (segment.start === segment.end) return region.oldStart === segment.start;
        if (region.oldStart === segment.start) return markerInsertionIsManual && segment.markers;
        return region.oldStart > segment.start && region.oldStart <= segment.end;
      }
      return segment.start < region.oldEnd && segment.end > region.oldStart;
    });
    if (hits.length === 0) continue;

    const contained = hits.length === 1 && (
      insertion
        ? (region.oldStart > hits[0].start && region.oldStart <= hits[0].end) ||
          (hits[0].start === hits[0].end && region.oldStart === hits[0].start) ||
          (markerInsertionIsManual && hits[0].markers && region.oldStart === hits[0].start)
        : region.oldStart >= hits[0].start && region.oldEnd <= hits[0].end
    );

    if (contained) {
      const segment = hits[0];
      containedBySegment.get(segment.id).push(region);
      if (!modeBySegment.has(segment.id)) modeBySegment.set(segment.id, "replace");
    } else {
      for (const segment of hits) modeBySegment.set(segment.id, "preserve");
    }
  }

  const mapped = [];
  let last = 0;
  for (const segment of segments) {
    const own = containedBySegment.get(segment.id);
    const ownSet = new Set(own);
    const beforeDelta = regions
      .filter((region) => !ownSet.has(region) && region.oldEnd <= segment.start)
      .reduce((sum, region) => sum + region.delta, 0);
    const insideDelta = own.reduce((sum, region) => sum + region.delta, 0);
    let start = segment.start + beforeDelta;
    let end = segment.end + beforeDelta + insideDelta;
    start = Math.max(0, Math.min(newLines.length, Math.max(start, last)));
    end = Math.max(start, Math.min(newLines.length, end));
    mapped.push({ id: segment.id, start, end, ...(segment.markers ? { markers: true } : {}) });
    last = end;
  }

  const edits = [];
  for (const segment of segments) {
    const mode = modeBySegment.get(segment.id);
    if (!mode) continue;
    const nextSegment = mapped.find((candidate) => candidate.id === segment.id);
    const lines = mode === "replace"
      ? newLines.slice(nextSegment.start, nextSegment.end)
      : oldLines.slice(segment.start, segment.end);
    edits.push({ id: segment.id, lines });
  }

  return { newLines, segments: mapped, edits, wholePaneReplacement };
}


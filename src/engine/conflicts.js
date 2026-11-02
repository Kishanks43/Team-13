import { diffText } from "./diff.js";

export function findConflicts(ops) {
  const conflicts = [];
  let start = -1;
  const flush = (end) => {
    if (start < 0) return;
    const changed = ops.slice(start, end);
    const aLines = changed.filter((op) => op.type === "remove").map((op) => op.text);
    const bLines = changed.filter((op) => op.type === "add").map((op) => op.text);
    const firstA = changed.find((op) => op.aLine !== null);
    const firstB = changed.find((op) => op.bLine !== null);
    conflicts.push({
      id: conflicts.length + 1,
      type: aLines.length && bLines.length ? "changed" : bLines.length ? "added" : "removed",
      aStart: firstA?.aLine ?? (changed[0]?.aLine ?? 1),
      bStart: firstB?.bLine ?? (changed[0]?.bLine ?? 1),
      aLines,
      bLines,
      opStart: start,
      opEnd: end
    });
    start = -1;
  };

  ops.forEach((op, index) => {
    if (op.type !== "equal") {
      if (start < 0) start = index;
    } else {
      flush(index);
    }
  });
  flush(ops.length);
  return conflicts;
}

export function findConflictsInText(textA, textB) {
  return findConflicts(diffText(textA, textB));
}
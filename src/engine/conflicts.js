import { diffText } from "./diff.js";

// A conflict is one maximal run of non-equal ops in the A-versus-B diff.
// Shape: { id, type, aStart, bStart, aLines, bLines, opStart, opEnd }
export function findConflicts(ops) {
  const conflicts = [];
  let aSeen = 0; // A lines before the current position
  let bSeen = 0; // B lines before the current position
  let i = 0;

  while (i < ops.length) {
    if (ops[i].type === "equal") {
      aSeen++;
      bSeen++;
      i++;
      continue;
    }
    const opStart = i;
    const aStart = aSeen + 1;
    const bStart = bSeen + 1;
    const aLines = [];
    const bLines = [];
    while (i < ops.length && ops[i].type !== "equal") {
      if (ops[i].type === "remove") {
        aLines.push(ops[i].text);
        aSeen++;
      } else {
        bLines.push(ops[i].text);
        bSeen++;
      }
      i++;
    }
    let type = "changed";
    if (aLines.length === 0) type = "added";
    else if (bLines.length === 0) type = "removed";
    conflicts.push({
      id: conflicts.length + 1,
      type,
      aStart,
      bStart,
      aLines,
      bLines,
      opStart,
      opEnd: i
    });
  }
  return conflicts;
}

export function findConflictsInText(textA, textB) {
  return findConflicts(diffText(textA, textB));
}

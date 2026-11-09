import { diffText } from "./diff.js";

// A conflict is one maximal run of non-equal ops. Ids count from 1.
export function findConflicts(ops) {
  const conflicts = [];
  let aCount = 0;
  let bCount = 0;
  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === "equal") {
      aCount++;
      bCount++;
      i++;
      continue;
    }
    const opStart = i;
    const aStart = aCount + 1;
    const bStart = bCount + 1;
    const aLines = [];
    const bLines = [];
    while (i < ops.length && ops[i].type !== "equal") {
      if (ops[i].type === "remove") {
        aLines.push(ops[i].text);
        aCount++;
      } else {
        bLines.push(ops[i].text);
        bCount++;
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

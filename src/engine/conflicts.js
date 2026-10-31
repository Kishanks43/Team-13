/**
 * Conflicts: the places where Version A and Version B differ.
 *
 * A conflict is one maximal run of changed lines in the A-versus-B diff, so the number of
 * conflicts always equals countChangeRegions(ops). Conflicts are numbered 1, 2, 3 ... in the
 * order they appear, and those ids stay the same for as long as the diff does.
 *
 * Shape of a conflict:
 *   {
 *     id,        // 1-based position in the list
 *     type,      // "changed" (both sides have lines), "added" (only B has lines) or "removed" (only A has lines)
 *     aStart,    // 1-based line in Version A where the conflict begins
 *     bStart,    // 1-based line in Version B where the conflict begins
 *     aLines,    // the lines Version A has here (empty when type is "added")
 *     bLines,    // the lines Version B has here (empty when type is "removed")
 *     opStart,   // index of the conflict's first op in the ops array
 *     opEnd,     // index just past its last op (ops.slice(opStart, opEnd) is exactly this conflict)
 *   }
 * When one side has no lines, its start is the line where those lines would be inserted.
 */
import { diffText } from "./diff.js";

/** Group a diff (the ops from diffLines or diffText) into conflicts. */
export function findConflicts(ops) {
  const conflicts = [];
  let aPos = 1; // the next line number in Version A
  let bPos = 1; // the next line number in Version B
  let current = null;

  function close(end) {
    current.opEnd = end;
    current.type = current.aLines.length > 0 && current.bLines.length > 0 ? "changed" : current.bLines.length > 0 ? "added" : "removed";
    conflicts.push(current);
    current = null;
  }

  ops.forEach((op, index) => {
    if (op.type === "equal") {
      if (current) close(index);
      aPos++;
      bPos++;
      return;
    }

    if (!current) {
      current = { id: conflicts.length + 1, type: "changed", aStart: aPos, bStart: bPos, aLines: [], bLines: [], opStart: index, opEnd: index };
    }
    if (op.type === "remove") {
      current.aLines.push(op.text);
      aPos++;
    } else {
      current.bLines.push(op.text);
      bPos++;
    }
  });

  if (current) close(ops.length);
  return conflicts;
}

/** Convenience: compare two texts and return their conflicts. */
export function findConflictsInText(textA, textB) {
  return findConflicts(diffText(textA, textB));
}

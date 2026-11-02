import { getStatus } from "./resolutions.js";

// An open conflict contributes no lines. "both" is Version A followed by Version B.
export function buildMergedLines(ops, conflicts, resolutions) {
  const conflictAt = new Map(conflicts.map((conflict) => [conflict.opStart, conflict]));
  const output = [];
  let index = 0;

  while (index < ops.length) {
    const conflict = conflictAt.get(index);
    if (conflict) {
      const status = getStatus(resolutions, conflict.id);
      if (status === "A") output.push(...conflict.aLines);
      else if (status === "B") output.push(...conflict.bLines);
      else if (status === "both") output.push(...conflict.aLines, ...conflict.bLines);
      index = conflict.opEnd;
      continue;
    }
    if (ops[index].type === "equal") output.push(ops[index].text);
    index += 1;
  }
  return output;
}

export function buildMergedText(ops, conflicts, resolutions) {
  return buildMergedLines(ops, conflicts, resolutions).join("\n");
}
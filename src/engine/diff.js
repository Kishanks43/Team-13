// Small, deterministic line diff used by this self-contained Sprint 2 package.
export function splitLines(text) {
  if (text === "") return [];
  const lines = String(text).split(/\r\n|\n|\r/);
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

export function diffLines(aLines, bLines) {
  const n = aLines.length;
  const m = bLines.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = aLines[i] === bLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && aLines[i] === bLines[j]) {
      ops.push({ type: "equal", text: aLines[i], aLine: i + 1, bLine: j + 1 });
      i += 1;
      j += 1;
    } else if (i < n && (j === m || dp[i + 1][j] >= dp[i][j + 1])) {
      ops.push({ type: "remove", text: aLines[i], aLine: i + 1, bLine: null });
      i += 1;
    } else {
      ops.push({ type: "add", text: bLines[j], aLine: null, bLine: j + 1 });
      j += 1;
    }
  }
  return ops;
}

export function diffText(textA, textB) {
  return diffLines(splitLines(textA), splitLines(textB));
}

export function summarize(ops) {
  return ops.reduce((result, op) => {
    if (op.type === "add") result.added += 1;
    else if (op.type === "remove") result.removed += 1;
    else result.unchanged += 1;
    return result;
  }, { added: 0, removed: 0, unchanged: 0 });
}

export function countChangeRegions(ops) {
  let count = 0;
  let inChange = false;
  for (const op of ops) {
    if (op.type !== "equal" && !inChange) count += 1;
    inChange = op.type !== "equal";
  }
  return count;
}
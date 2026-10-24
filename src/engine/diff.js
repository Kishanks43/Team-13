/**
 * Line-based diff using Myers' O(ND) algorithm.
 *
 * Every item in a diff is an "op":
 *   { type: "equal" | "add" | "remove", text, aLine, bLine }
 * aLine / bLine are 1-based line numbers in Version A / Version B,
 * or null when the line does not exist on that side
 * (an added line has no aLine, a removed line has no bLine).
 */

/** Split text into lines, accepting LF, CRLF and CR. A trailing newline does not create an extra empty line. */
export function splitLines(text) {
  if (text === "") return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * Core Myers search. Returns edits in forward order as
 * ["equal", aIndex, bIndex], ["remove", aIndex] or ["add", bIndex].
 */
function myersEdits(a, b) {
  const n = a.length;
  const m = b.length;
  const edits = [];

  if (n === 0) {
    for (let j = 0; j < m; j++) edits.push(["add", j]);
    return edits;
  }
  if (m === 0) {
    for (let i = 0; i < n; i++) edits.push(["remove", i]);
    return edits;
  }

  const max = n + m;
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];

  let done = false;
  for (let d = 0; d <= max && !done; d++) {
    // Save the state before round d (only the slice round d can read).
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        done = true;
        break;
      }
    }
  }

  // Walk back from the end to recover the edits.
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const saved = trace[d];
    const at = (k) => saved[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      edits.push(["equal", x - 1, y - 1]);
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) edits.push(["add", prevY]);
      else edits.push(["remove", prevX]);
    }
    x = prevX;
    y = prevY;
  }
  return edits.reverse();
}

/** Inside each run of changes, list removals before additions so output reads the same way every time. */
function orderChangeRuns(ops) {
  const out = [];
  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === "equal") {
      out.push(ops[i++]);
      continue;
    }
    const run = [];
    while (i < ops.length && ops[i].type !== "equal") run.push(ops[i++]);
    out.push(...run.filter((op) => op.type === "remove"), ...run.filter((op) => op.type === "add"));
  }
  return out;
}

/** Diff two arrays of lines. */
export function diffLines(aLines, bLines) {
  // Trim the common beginning and end first: it makes typical edits very fast.
  let start = 0;
  while (start < aLines.length && start < bLines.length && aLines[start] === bLines[start]) start++;
  let endA = aLines.length;
  let endB = bLines.length;
  while (endA > start && endB > start && aLines[endA - 1] === bLines[endB - 1]) {
    endA--;
    endB--;
  }

  const ops = [];
  for (let i = 0; i < start; i++) {
    ops.push({ type: "equal", text: aLines[i], aLine: i + 1, bLine: i + 1 });
  }

  const midA = aLines.slice(start, endA);
  const midB = bLines.slice(start, endB);
  for (const [type, p, q] of myersEdits(midA, midB)) {
    if (type === "equal") {
      ops.push({ type, text: midA[p], aLine: start + p + 1, bLine: start + q + 1 });
    } else if (type === "remove") {
      ops.push({ type, text: midA[p], aLine: start + p + 1, bLine: null });
    } else {
      ops.push({ type, text: midB[p], aLine: null, bLine: start + p + 1 });
    }
  }

  for (let i = endA; i < aLines.length; i++) {
    ops.push({ type: "equal", text: aLines[i], aLine: i + 1, bLine: endB + (i - endA) + 1 });
  }
  return orderChangeRuns(ops);
}

/** Diff two strings of text. */
export function diffText(textA, textB) {
  return diffLines(splitLines(textA), splitLines(textB));
}

/** Count of added, removed and unchanged lines. */
export function summarize(ops) {
  const counts = { added: 0, removed: 0, unchanged: 0 };
  for (const op of ops) {
    if (op.type === "add") counts.added++;
    else if (op.type === "remove") counts.removed++;
    else counts.unchanged++;
  }
  return counts;
}

/** Number of separate regions of change (runs of consecutive added/removed lines). */
export function countChangeRegions(ops) {
  let regions = 0;
  let inChange = false;
  for (const op of ops) {
    const changed = op.type !== "equal";
    if (changed && !inChange) regions++;
    inChange = changed;
  }
  return regions;
}

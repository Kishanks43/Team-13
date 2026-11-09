// Line diff: Myers O(ND) with common prefix/suffix trimming. Pure logic, no browser APIs.

export function splitLines(text) {
  if (text === "") return [];
  const lines = text.split(/\r\n|\n|\r/);
  if (lines[lines.length - 1] === "") lines.pop(); // a trailing newline adds no extra line
  return lines;
}

// Returns edit steps for the middle part as an array of "e" (equal), "r" (remove), "a" (add).
function myersSteps(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) x = v[off + k + 1];
      else x = v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) return backtrack(trace, n, m);
    }
  }
  return backtrack(trace, n, m);
}

function backtrack(trace, n, m) {
  const steps = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const snap = trace[d];
    const at = (k) => snap[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      steps.push("e");
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) {
        steps.push("a");
        y--;
      } else {
        steps.push("r");
        x--;
      }
    }
  }
  return steps.reverse();
}

// Within a run of changes, removals come before additions.
function normalizeRuns(steps) {
  const out = [];
  let i = 0;
  while (i < steps.length) {
    if (steps[i] === "e") {
      out.push("e");
      i++;
      continue;
    }
    let removes = 0;
    let adds = 0;
    while (i < steps.length && steps[i] !== "e") {
      if (steps[i] === "r") removes++;
      else adds++;
      i++;
    }
    for (let r = 0; r < removes; r++) out.push("r");
    for (let a = 0; a < adds; a++) out.push("a");
  }
  return out;
}

export function diffLines(aLines, bLines) {
  let start = 0;
  const minLen = Math.min(aLines.length, bLines.length);
  while (start < minLen && aLines[start] === bLines[start]) start++;
  let endA = aLines.length;
  let endB = bLines.length;
  while (endA > start && endB > start && aLines[endA - 1] === bLines[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = aLines.slice(start, endA);
  const midB = bLines.slice(start, endB);
  let middle;
  if (midA.length === 0 || midB.length === 0) {
    middle = [...midA.map(() => "r"), ...midB.map(() => "a")];
  } else {
    const inB = new Set(midB);
    const share = midA.some((line) => inB.has(line));
    middle = share
      ? normalizeRuns(myersSteps(midA, midB))
      : [...midA.map(() => "r"), ...midB.map(() => "a")]; // nothing in common: skip Myers
  }

  const steps = [
    ...new Array(start).fill("e"),
    ...middle,
    ...new Array(aLines.length - endA).fill("e")
  ];

  const ops = [];
  let ai = 0;
  let bi = 0;
  for (const step of steps) {
    if (step === "e") {
      ops.push({ type: "equal", text: aLines[ai], aLine: ai + 1, bLine: bi + 1 });
      ai++;
      bi++;
    } else if (step === "r") {
      ops.push({ type: "remove", text: aLines[ai], aLine: ai + 1, bLine: null });
      ai++;
    } else {
      ops.push({ type: "add", text: bLines[bi], aLine: null, bLine: bi + 1 });
      bi++;
    }
  }
  return ops;
}

export function diffText(textA, textB) {
  return diffLines(splitLines(textA), splitLines(textB));
}

export function summarize(ops) {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const op of ops) {
    if (op.type === "add") added++;
    else if (op.type === "remove") removed++;
    else unchanged++;
  }
  return { added, removed, unchanged };
}

export function countChangeRegions(ops) {
  let regions = 0;
  let inRun = false;
  for (const op of ops) {
    if (op.type === "equal") {
      inRun = false;
    } else if (!inRun) {
      regions++;
      inRun = true;
    }
  }
  return regions;
}

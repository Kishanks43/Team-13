// Line diff (Myers O(ND)) with common prefix/suffix trimming. Pure logic, no browser APIs.

export function splitLines(text) {
  if (text === "" || text == null) return [];
  const lines = String(text).split(/\r\n|\n|\r/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

// Returns raw ops ({ type, text }) for two line arrays using Myers' algorithm.
function myers(a, b) {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  const max = n + m;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = -1;

  for (let d = 0; d <= max; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) {
        x = v[off + k + 1];
      } else {
        x = v[off + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
    if (found >= 0) break;
    trace.push(v.slice(off - d - 1, off + d + 2));
  }

  const ops = [];
  let x = n;
  let y = m;
  for (let d = found; d > 0; d--) {
    const prev = trace[d - 1];
    const at = (k) => prev[k + d]; // trace[d-1] covers k in [-d, d]
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push({ type: "equal", text: a[x - 1] });
      x--;
      y--;
    }
    if (x === prevX) {
      ops.push({ type: "add", text: b[prevY] });
    } else {
      ops.push({ type: "remove", text: a[prevX] });
    }
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    ops.push({ type: "equal", text: a[x - 1] });
    x--;
    y--;
  }
  return ops.reverse();
}

// Within a run of changes, put all removals before all additions.
function orderRuns(ops) {
  const out = [];
  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === "equal") {
      out.push(ops[i++]);
      continue;
    }
    const removes = [];
    const adds = [];
    while (i < ops.length && ops[i].type !== "equal") {
      (ops[i].type === "remove" ? removes : adds).push(ops[i]);
      i++;
    }
    out.push(...removes, ...adds);
  }
  return out;
}

export function diffLines(aLines, bLines) {
  let start = 0;
  while (start < aLines.length && start < bLines.length && aLines[start] === bLines[start]) start++;
  let endA = aLines.length;
  let endB = bLines.length;
  while (endA > start && endB > start && aLines[endA - 1] === bLines[endB - 1]) {
    endA--;
    endB--;
  }

  const raw = [
    ...aLines.slice(0, start).map((text) => ({ type: "equal", text })),
    ...orderRuns(myers(aLines.slice(start, endA), bLines.slice(start, endB))),
    ...aLines.slice(endA).map((text) => ({ type: "equal", text }))
  ];

  let aLine = 0;
  let bLine = 0;
  return raw.map((op) => {
    if (op.type === "equal") {
      aLine++;
      bLine++;
      return { type: "equal", text: op.text, aLine, bLine };
    }
    if (op.type === "remove") {
      aLine++;
      return { type: "remove", text: op.text, aLine, bLine: null };
    }
    bLine++;
    return { type: "add", text: op.text, aLine: null, bLine };
  });
}

export function diffText(textA, textB) {
  return diffLines(splitLines(textA), splitLines(textB));
}

export function summarize(ops) {
  const summary = { added: 0, removed: 0, unchanged: 0 };
  for (const op of ops) {
    if (op.type === "add") summary.added++;
    else if (op.type === "remove") summary.removed++;
    else summary.unchanged++;
  }
  return summary;
}

export function countChangeRegions(ops) {
  let regions = 0;
  let inRun = false;
  for (const op of ops) {
    if (op.type === "equal") {
      inRun = false;
    } else if (!inRun) {
      inRun = true;
      regions++;
    }
  }
  return regions;
}

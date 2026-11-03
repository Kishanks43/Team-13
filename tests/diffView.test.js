export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
 
const MARKERS = { equal: " ", changed: "~", removed: "-", added: "+" };
 
// Turns diff ops into side-by-side rows:
// { kind: "equal" | "changed" | "removed" | "added", marker, left, right }
// where left and right are { num, text } or null when that side has no line.
// Inside a run of changes, removed and added lines are paired into "changed"
// rows first; any extras stay as "removed" or "added" rows.
export function buildRows(ops) {
  const rows = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push({
        kind: "equal",
        marker: MARKERS.equal,
        left: { num: op.aLine, text: op.text },
        right: { num: op.bLine, text: op.text }
      });
      i++;
      continue;
    }
    const removes = [];
    const adds = [];
    while (i < ops.length && ops[i].type !== "equal") {
      (ops[i].type === "remove" ? removes : adds).push(ops[i]);
      i++;
    }
    const length = Math.max(removes.length, adds.length);
    for (let j = 0; j < length; j++) {
      const r = removes[j];
      const a = adds[j];
      const kind = r && a ? "changed" : r ? "removed" : "added";
      rows.push({
        kind,
        marker: MARKERS[kind],
        left: r ? { num: r.aLine, text: r.text } : null,
        right: a ? { num: a.bLine, text: a.text } : null
      });
    }
  }
  return rows;
}
 
function renderSide(side, cls) {
  const num = side ? side.num : "";
  const text = side ? escapeHtml(side.text) : "";
  return `<td class="diff-num">${num}</td><td class="diff-code ${cls}">${text}</td>`;
}
 
// Returns an HTML string. All pasted text goes through escapeHtml.
export function renderSideBySide(rows) {
  const body = rows
    .map(
      (row) =>
        `<tr class="diff-row diff-${row.kind}">` +
        renderSide(row.left, "diff-left") +
        `<td class="diff-marker">${row.marker}</td>` +
        renderSide(row.right, "diff-right") +
        `</tr>`
    )
    .join("");
  return (
    `<table class="diff-table">` +
    `<colgroup><col class="col-num"><col class="col-code"><col class="col-marker">` +
    `<col class="col-num"><col class="col-code"></colgroup>` +
    `<thead><tr><th colspan="2" scope="col">Version A</th><th scope="col"><span class="visually-hidden">Change</span></th>` +
    `<th colspan="2" scope="col">Version B</th></tr></thead>` +
    `<tbody>${body}</tbody></table>`
  );
}


// Rendering helpers for the side-by-side diff view.

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Pairs removed and added lines inside a change run into "changed" rows.
export function buildRows(ops) {
  const rows = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push({ type: "equal", aLine: op.aLine, bLine: op.bLine, aText: op.text, bText: op.text });
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
      let type = "changed";
      if (r && !a) type = "remove";
      else if (a && !r) type = "add";
      rows.push({
        type,
        aLine: r ? r.aLine : null,
        bLine: a ? a.bLine : null,
        aText: r ? r.text : "",
        bText: a ? a.text : ""
      });
    }
  }
  return rows;
}

const MARKERS = { equal: " ", add: "+", remove: "-", changed: "~" };

export function renderSideBySide(rows) {
  const body = rows
    .map(
      (row) =>
        `<tr class="row-${row.type}">` +
        `<td class="num">${row.aLine ?? ""}</td>` +
        `<td class="code">${escapeHtml(row.aText)}</td>` +
        `<td class="marker">${MARKERS[row.type]}</td>` +
        `<td class="num">${row.bLine ?? ""}</td>` +
        `<td class="code">${escapeHtml(row.bText)}</td>` +
        `</tr>`
    )
    .join("");
  return `<table class="diff-table"><tbody>${body}</tbody></table>`;
}

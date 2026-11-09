// Every piece of user text goes through escapeHtml before it reaches innerHTML.
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Pairs removed and added lines inside one run into "change" rows.
export function buildRows(ops) {
  const rows = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push({ type: "equal", aLine: op.aLine, aText: op.text, bLine: op.bLine, bText: op.text });
      i++;
      continue;
    }
    const removed = [];
    const added = [];
    while (i < ops.length && ops[i].type !== "equal") {
      (ops[i].type === "remove" ? removed : added).push(ops[i]);
      i++;
    }
    const count = Math.max(removed.length, added.length);
    for (let r = 0; r < count; r++) {
      const a = removed[r];
      const b = added[r];
      let type = "change";
      if (!b) type = "remove";
      else if (!a) type = "add";
      rows.push({
        type,
        aLine: a ? a.aLine : null,
        aText: a ? a.text : "",
        bLine: b ? b.bLine : null,
        bText: b ? b.text : ""
      });
    }
  }
  return rows;
}

const MARKERS = { equal: " ", add: "+", remove: "-", change: "~" };

// Returns an HTML string.
export function renderSideBySide(rows) {
  const body = rows
    .map(
      (row) =>
        `<tr class="row-${row.type}">` +
        `<td class="marker">${MARKERS[row.type]}</td>` +
        `<td class="ln">${row.aLine === null ? "" : row.aLine}</td>` +
        `<td class="code">${escapeHtml(row.aText)}</td>` +
        `<td class="ln">${row.bLine === null ? "" : row.bLine}</td>` +
        `<td class="code">${escapeHtml(row.bText)}</td>` +
        `</tr>`
    )
    .join("");
  return (
    `<table class="diff-table">` +
    `<thead><tr><th></th><th>A line</th><th>Version A</th><th>B line</th><th>Version B</th></tr></thead>` +
    `<tbody>${body}</tbody></table>`
  );
}

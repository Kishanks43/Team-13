/**
 * Side-by-side view of a diff.
 *
 * buildRows(ops)        turns diff ops into aligned rows (pure data, easy to test)
 * renderSideBySide(rows) turns rows into an HTML table string
 *
 * Every changed row carries a text marker as well as a colour, so the view
 * never relies on colour alone:  " " same   "~" changed   "-" removed   "+" added
 */

const MARKERS = { equal: " ", changed: "~", removed: "-", added: "+" };
const LABELS = { equal: "", changed: "changed", removed: "removed", added: "added" };

/** Make text safe to place inside HTML, so pasted code is shown as text and never run. */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeRow(kind, left, right) {
  return { kind, marker: MARKERS[kind], left, right };
}

/**
 * Pair up diff ops into side-by-side rows.
 * Inside a change, the first removed line is shown next to the first added line
 * (a "changed" row); leftovers are shown alone as "removed" or "added".
 */
export function buildRows(ops) {
  const rows = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === "equal") {
      rows.push(makeRow("equal", { num: op.aLine, text: op.text }, { num: op.bLine, text: op.text }));
      i++;
      continue;
    }

    const removed = [];
    const added = [];
    while (i < ops.length && ops[i].type !== "equal") {
      (ops[i].type === "remove" ? removed : added).push(ops[i]);
      i++;
    }

    const paired = Math.min(removed.length, added.length);
    for (let p = 0; p < paired; p++) {
      rows.push(
        makeRow("changed", { num: removed[p].aLine, text: removed[p].text }, { num: added[p].bLine, text: added[p].text })
      );
    }
    for (let p = paired; p < removed.length; p++) {
      rows.push(makeRow("removed", { num: removed[p].aLine, text: removed[p].text }, null));
    }
    for (let p = paired; p < added.length; p++) {
      rows.push(makeRow("added", null, { num: added[p].bLine, text: added[p].text }));
    }
  }
  return rows;
}

function sideCells(side) {
  if (!side) return '<td class="num"></td><td class="code empty"></td>';
  return `<td class="num">${side.num}</td><td class="code">${escapeHtml(side.text)}</td>`;
}

/** Build the HTML table for a list of rows. */
export function renderSideBySide(rows) {
  const body = rows
    .map((row) => {
      const label = LABELS[row.kind];
      const mark = label
        ? `<td class="mark" title="${label}" aria-label="${label}">${row.marker}</td>`
        : '<td class="mark"></td>';
      return `<tr class="diff-row diff-${row.kind}">${sideCells(row.left)}${mark}${sideCells(row.right)}</tr>`;
    })
    .join("");

  return (
    '<table class="diff" aria-label="Side-by-side comparison of Version A and Version B">' +
    '<colgroup><col class="c-num"><col class="c-code"><col class="c-mark"><col class="c-num"><col class="c-code"></colgroup>' +
    '<thead><tr><th colspan="2" scope="colgroup">Version A</th><th class="mark"></th><th colspan="2" scope="colgroup">Version B</th></tr></thead>' +
    `<tbody>${body}</tbody></table>`
  );
}

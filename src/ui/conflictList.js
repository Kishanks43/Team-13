/**
 * The conflict list: one line per conflict showing where it is and its status
 * (Open, A, B, Both or Manual). Returns an HTML string; every item is a button with a
 * data-conflict-id, so the page can find out which conflict was clicked.
 */
import { getStatus } from "../engine/resolutions.js";
import { escapeHtml } from "./diffView.js";

const LABELS = { open: "Open", A: "A", B: "B", both: "Both", manual: "Manual" };

/** "A: lines 3-4", "B: line 7" or "A: none". */
export function describeSide(name, start, count) {
  if (count === 0) return `${name}: none`;
  if (count === 1) return `${name}: line ${start}`;
  return `${name}: lines ${start}-${start + count - 1}`;
}

/** Build the list for the current conflicts, decisions and selected conflict (selectedId may be null). */
export function renderConflictList(conflicts, resolutions, selectedId = null) {
  if (conflicts.length === 0) return '<p class="conflict-empty">No conflicts to list.</p>';

  const items = conflicts.map((conflict) => {
    const status = getStatus(resolutions, conflict.id);
    const current = conflict.id === selectedId ? ' aria-current="true"' : "";
    const where = `${describeSide("A", conflict.aStart, conflict.aLines.length)}, ${describeSide("B", conflict.bStart, conflict.bLines.length)}`;
    return (
      `<li><button type="button" class="conflict-item status-${status}" data-conflict-id="${conflict.id}"${current}>` +
      `<span class="conflict-name">Conflict ${conflict.id}</span>` +
      `<span class="conflict-lines">${escapeHtml(where)}</span>` +
      `<span class="conflict-status">${LABELS[status]}</span>` +
      `</button></li>`
    );
  });
  return `<ol class="conflict-list">${items.join("")}</ol>`;
}

import { escapeHtml } from "./diffView.js";
import { getStatus } from "../engine/resolutions.js";

const STATUS_LABELS = { open: "Open", A: "A", B: "B", both: "Both", manual: "Manual" };
const TYPE_LABELS = { changed: "changed", added: "added in B", removed: "removed in B" };

// "line 3", "lines 3\u20135", or "none (before line 3)" when a side has no lines.
export function describeLines(start, count) {
  if (count === 0) return `none (before line ${start})`;
  if (count === 1) return `line ${start}`;
  return `lines ${start}\u2013${start + count - 1}`;
}

// "A: lines 3\u20135"
export function describeSide(label, start, count) {
  return `${label}: ${describeLines(start, count)}`;
}

// Builds the conflict list as an HTML string. Each conflict has one select button
// (data-conflict-id) and three accept buttons (data-action + data-id). Status is shown as
// text, so it never depends on colour alone.
export function renderConflictList(conflicts, resolutions, selectedId) {
  if (conflicts.length === 0) return `<p class="empty">No conflicts to show.</p>`;
  const items = conflicts
    .map((c) => {
      const status = getStatus(resolutions, c.id);
      const selected = c.id === selectedId;
      const id = escapeHtml(c.id);
      const summary = `${describeSide("A", c.aStart, c.aLines.length)}, ${describeSide("B", c.bStart, c.bLines.length)}`;
      const accept = (action, label) =>
        `<button type="button" class="accept" data-action="${action}" data-id="${id}">${escapeHtml(label)}</button>`;
      return (
        `<li class="conflict-item status-${escapeHtml(status)}${selected ? " is-selected" : ""}">` +
        `<button type="button" class="conflict-select" data-conflict-id="${id}">` +
        `<span class="conflict-title">Conflict ${id} (${escapeHtml(TYPE_LABELS[c.type])})</span>` +
        `<span class="conflict-range">${escapeHtml(summary)}</span>` +
        `<span class="conflict-status">Status: ${escapeHtml(STATUS_LABELS[status])}</span>` +
        `</button>` +
        `<span class="conflict-actions">` +
        `${accept("A", "A")}${accept("B", "B")}${accept("both", "Both")}</span>` +
        `</li>`
      );
    })
    .join("");
  return `<ol class="conflicts">${items}</ol>`;
}

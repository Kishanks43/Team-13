import { escapeHtml } from "./diffView.js";
import { getStatus } from "../engine/resolutions.js";

const STATUS_LABELS = { open: "Open", A: "A", B: "B", both: "Both", manual: "Manual" };
const TYPE_LABELS = { changed: "changed", added: "added in B", removed: "removed in B" };

function range(start, count) {
  if (count === 0) return `none (before line ${start})`;
  if (count === 1) return `line ${start}`;
  return `lines ${start}\u2013${start + count - 1}`;
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
      const summary = `A: ${range(c.aStart, c.aLines.length)}, B: ${range(c.bStart, c.bLines.length)}`;
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

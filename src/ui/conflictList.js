import { escapeHtml } from "./diffView.js";

const STATUS_LABELS = { open: "Open", A: "A", B: "B", both: "Both", manual: "Manual" };

// Describes where one side of a conflict sits, for example "lines 3-5" or "no lines (before line 4)".
export function describeSide(start, lines) {
  if (!lines || lines.length === 0) return `no lines (before line ${start})`;
  if (lines.length === 1) return `line ${start}`;
  return `lines ${start}-${start + lines.length - 1}`;
}

// Builds the conflict list as an HTML string. Each item has a select button
// (data-conflict-id) and Accept A / B / Both buttons (data-action + data-id).
export function renderConflictList(conflicts, resolutions = {}, selectedId = null) {
  if (!conflicts || conflicts.length === 0) {
    return '<p class="empty-state">No conflicts.</p>';
  }
  const items = conflicts
    .map((conflict) => {
      const status = Object.prototype.hasOwnProperty.call(resolutions, conflict.id)
        ? resolutions[conflict.id]
        : "open";
      const selected = conflict.id === selectedId;
      const label = STATUS_LABELS[status] ?? status;
      const actions = [
        ["A", "Accept A"],
        ["B", "Accept B"],
        ["both", "Accept Both"]
      ]
        .map(
          ([action, text]) =>
            `<button type="button" class="button button-small${status === action ? " is-active" : ""}" ` +
            `data-action="${action}" data-id="${conflict.id}" aria-pressed="${status === action}">${text}</button>`
        )
        .join("");
      return (
        `<li class="conflict-item status-${escapeHtml(status)}${selected ? " is-selected" : ""}">` +
        `<button type="button" class="conflict-select" data-conflict-id="${conflict.id}"` +
        `${selected ? ' aria-current="true"' : ""}>` +
        `<span class="conflict-title">Conflict ${conflict.id} · ${escapeHtml(conflict.type)}</span>` +
        `<span class="conflict-ranges">A: ${escapeHtml(describeSide(conflict.aStart, conflict.aLines))}` +
        ` · B: ${escapeHtml(describeSide(conflict.bStart, conflict.bLines))}</span>` +
        `<span class="status-badge">${escapeHtml(label)}</span>` +
        `</button>` +
        `<div class="conflict-actions">${actions}</div>` +
        `</li>`
      );
    })
    .join("");
  return `<ul class="conflict-items">${items}</ul>`;
}

import { getStatus } from "../engine/resolutions.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function renderConflictList(conflicts, resolutions, selectedId) {
  if (!conflicts.length) return '<p class="empty-state">No conflicts found. The versions are identical.</p>';
  return conflicts.map((conflict) => {
    const status = getStatus(resolutions, conflict.id);
    const range = `A:${conflict.aStart} · B:${conflict.bStart}`;
    const selected = conflict.id === selectedId ? " is-selected" : "";
    const aText = escapeHtml(conflict.aLines.join("\n") || "(no lines)");
    const bText = escapeHtml(conflict.bLines.join("\n") || "(no lines)");
    return `<article class="conflict-card${selected}" data-conflict-id="${conflict.id}">
      <div class="conflict-topline"><strong>Conflict ${conflict.id}</strong><span class="status status-${status.toLowerCase()}">${status === "both" ? "Both" : status === "open" ? "Open" : status}</span><span class="muted">${range}</span></div>
      <div class="conflict-sides"><div><small>Version A</small><pre>${aText}</pre></div><div><small>Version B</small><pre>${bText}</pre></div></div>
      <div class="resolution-actions">
        <button type="button" class="button accept-button" data-action="A" data-id="${conflict.id}">Accept A</button>
        <button type="button" class="button accept-button" data-action="B" data-id="${conflict.id}">Accept B</button>
        <button type="button" class="button accept-button" data-action="both" data-id="${conflict.id}">Accept Both</button>
      </div>
    </article>`;
  }).join("");
}
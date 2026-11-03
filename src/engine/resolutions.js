// A resolution state is a plain object { [conflictId]: status }. A missing id means "open".
// States are never changed in place, so keeping an old one is a snapshot (used by undo/redo).

export const STATUSES = Object.freeze(["open", "A", "B", "both", "manual"]);

export function isStatus(status) {
  return STATUSES.includes(status);
}

export function createResolutions() {
  return {};
}

export function getStatus(res, id) {
  return Object.prototype.hasOwnProperty.call(res, id) ? res[id] : "open";
}

export function setStatus(res, id, status) {
  if (!isStatus(status)) {
    throw new RangeError(`Unknown resolution status: ${status}`);
  }
  return { ...res, [id]: status };
}

export function summarizeProgress(conflicts, res) {
  const byStatus = { open: 0, A: 0, B: 0, both: 0, manual: 0 };
  for (const conflict of conflicts) {
    byStatus[getStatus(res, conflict.id)]++;
  }
  const total = conflicts.length;
  const remaining = byStatus.open;
  return { total, resolved: total - remaining, remaining, byStatus };
}

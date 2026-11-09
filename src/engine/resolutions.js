export const STATUSES = ["open", "A", "B", "both", "manual"];

// A resolution state is a plain object { [conflictId]: status }. A missing id means "open".
export function createResolutions() {
  return {};
}

export function getStatus(res, id) {
  return res[id] === undefined ? "open" : res[id];
}

// Never changes the old state, so keeping an old one is a snapshot.
export function setStatus(res, id, status) {
  if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  return { ...res, [id]: status };
}

export function summarizeProgress(conflicts, res) {
  const byStatus = { open: 0, A: 0, B: 0, both: 0, manual: 0 };
  for (const conflict of conflicts) byStatus[getStatus(res, conflict.id)]++;
  const total = conflicts.length;
  const remaining = byStatus.open;
  return { total, resolved: total - remaining, remaining, byStatus };
}

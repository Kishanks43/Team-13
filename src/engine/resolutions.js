export const STATUSES = Object.freeze(["open", "A", "B", "both", "manual"]);

export function createResolutions() {
  return {};
}

export function getStatus(resolutions, id) {
  return resolutions[id] ?? "open";
}

export function setStatus(resolutions, id, status) {
  if (!STATUSES.includes(status)) throw new Error(`Unknown resolution status: ${status}`);
  return { ...resolutions, [id]: status };
}

export function summarizeProgress(conflicts, resolutions) {
  const byStatus = { open: 0, A: 0, B: 0, both: 0, manual: 0 };
  for (const conflict of conflicts) byStatus[getStatus(resolutions, conflict.id)] += 1;
  const total = conflicts.length;
  const resolved = total - byStatus.open;
  return { total, resolved, remaining: total - resolved, byStatus };
}
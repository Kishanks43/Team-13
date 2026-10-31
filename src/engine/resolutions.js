/**
 * Resolution state: what the user has decided for each conflict.
 *
 * The state is a plain object that maps a conflict id to a status. A conflict that is not in the
 * object is "open". The functions below never change the object they are given; they return a new
 * one, so older states can be kept as snapshots (this is what undo and redo will use).
 *
 * Statuses:
 *   "open"    not resolved yet
 *   "A"       the user took Version A's lines
 *   "B"       the user took Version B's lines
 *   "both"    the user took A's lines followed by B's lines
 *   "manual"  the user edited the merged text by hand
 * Everything except "open" counts as resolved.
 */

export const STATUSES = ["open", "A", "B", "both", "manual"];

/** A fresh state in which every conflict is open. */
export function createResolutions() {
  return {};
}

/** The status of one conflict. */
export function getStatus(resolutions, id) {
  return resolutions[id] ?? "open";
}

/** Return a new state with one conflict set to a status. Throws if the status is not recognised. */
export function setStatus(resolutions, id, status) {
  if (!STATUSES.includes(status)) {
    throw new RangeError(`Unknown status "${status}". Use one of: ${STATUSES.join(", ")}.`);
  }
  const next = { ...resolutions };
  if (status === "open") delete next[id];
  else next[id] = status;
  return next;
}

/**
 * Count progress over a list of conflicts. Entries for ids that are not in the list are ignored.
 * Returns { total, resolved, remaining, byStatus: { open, A, B, both, manual } }.
 */
export function summarizeProgress(conflicts, resolutions) {
  const byStatus = { open: 0, A: 0, B: 0, both: 0, manual: 0 };
  for (const conflict of conflicts) byStatus[getStatus(resolutions, conflict.id)]++;
  const total = conflicts.length;
  const remaining = byStatus.open;
  return { total, resolved: total - remaining, remaining, byStatus };
}

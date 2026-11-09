import { findConflicts } from "./conflicts.js";
import { createResolutions, setStatus, getStatus, summarizeProgress } from "./resolutions.js";

export const HISTORY_LIMIT = 100; // the roadmap asks for at least 50 undo steps

// The one place that holds conflict state, resolutions, selection and undo history.
export function createSession() {
  let conflicts = [];
  let resolutions = createResolutions();
  let selectedId = null;
  let past = [];
  let future = [];
  const listeners = new Set();

  const getState = () => ({
    conflicts,
    resolutions,
    progress: summarizeProgress(conflicts, resolutions),
    selectedId
  });

  const notify = () => {
    const state = getState();
    for (const fn of [...listeners]) fn(state);
  };

  const requireConflict = (id) => {
    if (!conflicts.some((c) => c.id === id)) throw new RangeError(`Unknown conflict id: ${id}`);
  };

  return {
    // Starts over from a new diff: every conflict reopens, selection and history clear.
    load(ops) {
      conflicts = findConflicts(ops);
      resolutions = createResolutions();
      selectedId = null;
      past = [];
      future = [];
      notify();
    },
    resolve(id, status) {
      requireConflict(id);
      const next = setStatus(resolutions, id, status); // throws on an unknown status
      if (getStatus(resolutions, id) === status) return;
      past.push(resolutions);
      if (past.length > HISTORY_LIMIT) past.shift();
      future = [];
      resolutions = next;
      selectedId = id;
      notify();
    },
    select(id) {
      if (id !== null) requireConflict(id);
      selectedId = id;
      notify();
    },
    // Sets the resolutions directly (used by undo and redo, handy for tests).
    restore(snapshot) {
      resolutions = snapshot;
      notify();
    },
    undo() {
      if (past.length === 0) return false;
      future.push(resolutions);
      resolutions = past.pop();
      notify();
      return true;
    },
    redo() {
      if (future.length === 0) return false;
      past.push(resolutions);
      resolutions = future.pop();
      notify();
      return true;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState
  };
}

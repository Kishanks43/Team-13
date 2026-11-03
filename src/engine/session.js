import { findConflicts } from "./conflicts.js";
import {
  createResolutions,
  getStatus,
  isStatus,
  setStatus,
  summarizeProgress
} from "./resolutions.js";
import { createHistory, DEFAULT_HISTORY_LIMIT } from "./history.js";

// The one place that holds conflict and resolution state.
export function createSession({ historyLimit = DEFAULT_HISTORY_LIMIT } = {}) {
  let conflicts = [];
  let resolutions = createResolutions();
  let selectedId = null;
  const listeners = new Set();
  const history = createHistory(resolutions, { limit: historyLimit });

  const getState = () => ({
    conflicts,
    resolutions,
    progress: summarizeProgress(conflicts, resolutions),
    selectedId
  });

  const notify = () => {
    const state = getState();
    for (const listener of [...listeners]) listener(state);
  };

  const assertConflictId = (id) => {
    if (!conflicts.some((conflict) => conflict.id === id)) {
      throw new RangeError(`Unknown conflict id: ${id}`);
    }
  };

  return {
    load(ops) {
      conflicts = findConflicts(ops);
      resolutions = createResolutions();
      selectedId = null;
      history.clear(resolutions);
      notify();
    },
    resolve(id, status) {
      assertConflictId(id);
      if (!isStatus(status)) {
        throw new RangeError(`Unknown resolution status: ${status}`);
      }
      if (getStatus(resolutions, id) === status) return;
      resolutions = setStatus(resolutions, id, status);
      history.record(resolutions);
      notify();
    },
    select(id) {
      if (id !== null) assertConflictId(id);
      selectedId = id;
      notify();
    },
    undo() {
      if (!history.undo()) return false;
      resolutions = history.current();
      notify();
      return true;
    },
    redo() {
      if (!history.redo()) return false;
      resolutions = history.current();
      notify();
      return true;
    },
    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState
  };
}

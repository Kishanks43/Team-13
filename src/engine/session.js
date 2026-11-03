import { findConflicts } from "./conflicts.js";
import {
  createResolutions,
  isStatus,
  setStatus,
  summarizeProgress
} from "./resolutions.js";

// The one place that holds conflict and resolution state.
export function createSession() {
  let conflicts = [];
  let resolutions = createResolutions();
  let selectedId = null;
  const listeners = new Set();

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
      notify();
    },
    resolve(id, status) {
      assertConflictId(id);
      if (!isStatus(status)) {
        throw new RangeError(`Unknown resolution status: ${status}`);
      }
      resolutions = setStatus(resolutions, id, status);
      notify();
    },
    select(id) {
      if (id !== null) assertConflictId(id);
      selectedId = id;
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState
  };
}

import { findConflicts } from "./conflicts.js";
import { createResolutions, setStatus, summarizeProgress } from "./resolutions.js";

export function createSession() {
  let ops = [];
  let state = { conflicts: [], resolutions: createResolutions(), progress: summarizeProgress([], {}), selectedId: null };
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(state));

  return {
    load(nextOps) {
      ops = [...nextOps];
      const conflicts = findConflicts(ops);
      state = {
        conflicts,
        resolutions: createResolutions(),
        progress: summarizeProgress(conflicts, {}),
        selectedId: conflicts[0]?.id ?? null
      };
      notify();
    },
    resolve(id, status) {
      if (!state.conflicts.some((conflict) => conflict.id === id)) throw new Error(`Unknown conflict id: ${id}`);
      const resolutions = setStatus(state.resolutions, id, status);
      state = { ...state, resolutions, progress: summarizeProgress(state.conflicts, resolutions) };
      notify();
    },
    select(id) {
      if (id !== null && !state.conflicts.some((conflict) => conflict.id === id)) throw new Error(`Unknown conflict id: ${id}`);
      state = { ...state, selectedId: id };
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState() {
      return state;
    },
    getOps() {
      return ops;
    }
  };
}
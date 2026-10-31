/**
 * The merge session: the one place that holds the current conflicts, what has been decided about
 * each, and which conflict is selected. The page, the buttons, the counter and (later) undo all
 * read and change this state through the functions below.
 *
 *   load(ops)           start over from a new diff: finds the conflicts and reopens all of them
 *   resolve(id, status) record a decision for one conflict (status as in resolutions.js)
 *   select(id)          mark one conflict as the current one, or pass null for none
 *   subscribe(fn)       call fn(state) after every change; returns a function that stops it
 *   getState()          { conflicts, resolutions, progress, selectedId } as it is right now
 *
 * Listeners run synchronously inside load, resolve and select, so anything that shows the state
 * (such as the counter) is up to date the moment the call returns.
 */
import { findConflicts } from "./conflicts.js";
import { createResolutions, setStatus, summarizeProgress } from "./resolutions.js";

export function createSession() {
  let conflicts = [];
  let resolutions = createResolutions();
  let selectedId = null;
  const listeners = new Set();

  function getState() {
    return { conflicts, resolutions, progress: summarizeProgress(conflicts, resolutions), selectedId };
  }

  function notify() {
    const state = getState();
    for (const listener of [...listeners]) listener(state);
  }

  function requireConflict(id) {
    if (!conflicts.some((c) => c.id === id)) throw new RangeError(`There is no conflict with id ${id}.`);
  }

  return {
    load(ops) {
      conflicts = findConflicts(ops);
      resolutions = createResolutions();
      selectedId = null;
      notify();
    },
    resolve(id, status) {
      requireConflict(id);
      resolutions = setStatus(resolutions, id, status);
      notify();
    },
    select(id) {
      if (id !== null) requireConflict(id);
      selectedId = id;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState,
  };
}

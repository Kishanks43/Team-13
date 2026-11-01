/**
 * The merge session: the one place that holds the current conflicts, what has been decided about
 * each, and which conflict is selected. The page, the buttons, the counter and (later) undo all
 * read and change this state through the functions below.
 *
 *   load(ops)           start over from a new diff: finds the conflicts and reopens all of them
 *   resolve(id, status) record a decision for one conflict (status as in resolutions.js)
 *   select(id)          mark one conflict as the current one, or pass null for none
 *   subscribe(fn)       call fn(state) after every change; returns a function that stops it
 *   getState()          { conflicts, resolutions, progress, selectedId, canUndo, canRedo }
 *   restore(res)        replace every decision with a snapshot, as a new undoable action
 *   undo() / redo()     move through the resolution history; return true when they moved
 *
 * Listeners run synchronously inside every changing call, so anything that shows the state
 * (such as the counter) is up to date the moment the call returns.
 */
import { findConflicts } from "./conflicts.js";
import { createResolutions, getStatus, setStatus, summarizeProgress } from "./resolutions.js";
import { createHistory, DEFAULT_HISTORY_LIMIT } from "./history.js";

export function createSession({ historyLimit = DEFAULT_HISTORY_LIMIT } = {}) {
  let conflicts = [];
  let resolutions = createResolutions();
  let selectedId = null;
  const history = createHistory(resolutions, { limit: historyLimit });
  const listeners = new Set();

  function getState() {
    return {
      conflicts,
      resolutions,
      progress: summarizeProgress(conflicts, resolutions),
      selectedId,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    };
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
      history.clear(resolutions);
      notify();
    },
    resolve(id, status) {
      requireConflict(id);
      if (getStatus(resolutions, id) === status) return;
      resolutions = setStatus(resolutions, id, status);
      history.record(resolutions);
      notify();
    },
    select(id) {
      if (id !== null) requireConflict(id);
      selectedId = id;
      notify();
    },
    restore(next) {
      if (next === null || typeof next !== "object" || Array.isArray(next)) {
        throw new TypeError("A resolution snapshot must be a plain object.");
      }
      resolutions = { ...next };
      history.record(resolutions);
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
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState,
  };
}

export const DEFAULT_HISTORY_LIMIT = 100;

export function createHistory(initial = {}, { limit = DEFAULT_HISTORY_LIMIT } = {}) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("The history limit must be a positive integer.");
  }

  let past = [];
  let future = [];
  let current = initial;

  function record(next) {
    past.push(current);
    if (past.length > limit) past.shift();
    current = next;
    future = [];
  }

  function undo() {
    if (past.length === 0) return false;
    future.push(current);
    current = past.pop();
    return true;
  }

  function redo() {
    if (future.length === 0) return false;
    past.push(current);
    if (past.length > limit) past.shift();
    current = future.pop();
    return true;
  }

  function clear(next = initial) {
    past = [];
    future = [];
    current = next;
  }

  return {
    record,
    undo,
    redo,
    clear,
    current: () => current,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    undoDepth: () => past.length,
    redoDepth: () => future.length,
  };
}

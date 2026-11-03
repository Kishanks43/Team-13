// A tiny stand-in for the page so src/app.js can be driven in Jest's node environment.

function makeElement() {
  const listeners = {};
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    addEventListener(type, fn) {
      (listeners[type] ??= []).push(fn);
    },
    dispatch(type, event = {}) {
      for (const fn of listeners[type] ?? []) fn(event);
    }
  };
}

const IDS = [
  "pane-a",
  "pane-b",
  "compare-btn",
  "merged-result",
  "conflict-counter",
  "conflict-list",
  "count-a",
  "count-b",
  "merge-note"
];

export function createFakeDoc() {
  const elements = Object.fromEntries(IDS.map((id) => [id, makeElement()]));
  return {
    elements,
    getElementById: (id) => elements[id] ?? null
  };
}

// Click events as the conflict list handler sees them.
export function actionClick(action, id) {
  return {
    target: {
      closest: (selector) =>
        selector.includes("data-action") ? { dataset: { action, id: String(id) } } : null
    }
  };
}

export function selectClick(id) {
  return {
    target: {
      closest: (selector) =>
        selector.includes("data-conflict-id") ? { dataset: { conflictId: String(id) } } : null
    }
  };
}

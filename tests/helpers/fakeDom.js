// A tiny stand-in for the page so src/app.js can be driven in Jest's node environment.

function makeElement() {
  const listeners = {};
  const attributes = {};
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    addEventListener(type, fn) {
      (listeners[type] ??= []).push(fn);
    },
    dispatch(type, event = {}) {
      for (const fn of listeners[type] ?? []) fn(event);
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return attributes[name] ?? null;
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
  "merge-note",
  "apply-merge-btn",
  "apply-merge-note"
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

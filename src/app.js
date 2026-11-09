import { diffText, summarize } from "./engine/diff.js";
import { createSession } from "./engine/session.js";
import { buildMergedText } from "./engine/merge.js";
import { renderConflictList } from "./ui/conflictList.js";
import { buildRows, renderSideBySide } from "./ui/diffView.js";
import { formatProgress } from "./ui/progress.js";
import { describeMerge } from "./ui/mergeNote.js";
import { formatLoadNote } from "./ui/paneInfo.js";
import { loadFile } from "./fileLoader.js";
import { samples, getSample } from "./samples.js";

// Runs the diff on demand, and again 300 ms after the user stops typing once
// the first Compare has happened. Timers are injectable so tests need no clock.
export function createComparer({
  getA,
  getB,
  render,
  delay = 300,
  setTimer = (fn, ms) => window.setTimeout(fn, ms),
  clearTimer = (id) => window.clearTimeout(id)
}) {
  let live = false;
  let timer = null;

  const compare = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    live = true;
    const ops = diffText(getA(), getB());
    render(ops);
    return ops;
  };

  const onEdit = () => {
    if (!live) return;
    if (timer !== null) clearTimer(timer);
    timer = setTimer(() => {
      timer = null;
      compare();
    }, delay);
  };

  return { compare, onEdit, isLive: () => live };
}

export function formatSummary(ops) {
  const { added, removed, unchanged } = summarize(ops);
  return `${added} added · ${removed} removed · ${unchanged} unchanged`;
}

const lineCount = (text) => (text === "" ? 0 : text.split(/\r\n|\n|\r/).length);

export function init(doc = document, timers = {}) {
  const paneA = doc.getElementById("pane-a");
  const paneB = doc.getElementById("pane-b");
  const compareButton = doc.getElementById("compare-btn");
  const mergedResult = doc.getElementById("merged-result");
  const conflictCounter = doc.getElementById("conflict-counter");
  const conflictList = doc.getElementById("conflict-list");
  const countA = doc.getElementById("count-a");
  const countB = doc.getElementById("count-b");
  const mergeNote = doc.getElementById("merge-note");
  const diffSummary = doc.getElementById("diff-summary"); // optional
  const diffOutput = doc.getElementById("diff-output"); // optional
  const undoButton = doc.getElementById("undo-btn"); // optional
  const redoButton = doc.getElementById("redo-btn"); // optional
  const sampleSelect = doc.getElementById("sample-select"); // optional
  const loadSampleButton = doc.getElementById("load-sample-btn"); // optional
  const session = createSession();
  let currentOps = [];

  const updateCounts = () => {
    countA.textContent = `${lineCount(paneA.value)} lines`;
    countB.textContent = `${lineCount(paneB.value)} lines`;
  };

  // Runs on every session change (load, resolve, select). The counter updates here,
  // synchronously, so it is never behind the compare debounce.
  const render = (state) => {
    conflictCounter.textContent = formatProgress(state.progress);
    conflictList.innerHTML = renderConflictList(state.conflicts, state.resolutions, state.selectedId);
    // Only a session change rebuilds the merged text. Typing in the merged pane
    // never reaches this function, and nothing here ever writes to pane-a or pane-b.
    mergedResult.value = buildMergedText(currentOps, state.conflicts, state.resolutions);
    mergeNote.textContent = describeMerge(state.progress);
    if (undoButton) undoButton.disabled = !session.canUndo();
    if (redoButton) redoButton.disabled = !session.canRedo();
  };
  session.subscribe(render);

  const comparer = createComparer({
    ...timers,
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      currentOps = ops;
      if (diffSummary) diffSummary.textContent = formatSummary(ops);
      if (diffOutput) diffOutput.innerHTML = renderSideBySide(buildRows(ops));
      session.load(ops);
    }
  });

  compareButton.addEventListener("click", () => {
    comparer.compare();
    updateCounts();
  });

  conflictList.addEventListener("click", (event) => {
    const action = event.target.closest("button[data-action][data-id]");
    if (action) {
      session.resolve(Number(action.dataset.id), action.dataset.action);
      return;
    }
    const select = event.target.closest("button[data-conflict-id]");
    if (select) session.select(Number(select.dataset.conflictId));
  });

  // S2-05 decision: a hand edit changes only the merged pane. It does not touch
  // pane-a, pane-b or the resolution state. The next resolution click or
  // re-compare rebuilds the merged text, so the note says so.
  mergedResult.addEventListener("input", () => {
    mergeNote.textContent =
      "Edited by hand. Inputs are untouched. Choosing a resolution or re-comparing rebuilds this text.";
  });

  if (undoButton) undoButton.addEventListener("click", () => session.undo());
  if (redoButton) redoButton.addEventListener("click", () => session.redo());

  const onPaneInput = () => {
    updateCounts();
    comparer.onEdit();
  };
  paneA.addEventListener("input", onPaneInput);
  paneB.addEventListener("input", onPaneInput);

  // Samples
  if (sampleSelect) {
    if (sampleSelect.options.length === 0) {
      for (const sample of samples) {
        const option = doc.createElement("option");
        option.value = sample.id;
        option.textContent = sample.name;
        sampleSelect.appendChild(option);
      }
    }
    if (loadSampleButton) {
      loadSampleButton.addEventListener("click", () => {
        const sample = getSample(sampleSelect.value);
        if (!sample) return;
        paneA.value = sample.a;
        paneB.value = sample.b;
        comparer.compare();
        updateCounts();
      });
    }
  }

  // File loading: each pane has a Load button, a hidden file input and a note.
  for (const side of ["a", "b"]) {
    const button = doc.getElementById(`load-${side}-btn`);
    const input = doc.getElementById(`file-${side}`);
    const note = doc.getElementById(`note-${side}`);
    const pane = side === "a" ? paneA : paneB;
    if (!button || !input) continue;
    button.addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const result = await loadFile(file);
      if (note) note.textContent = formatLoadNote(result); // textContent: file names are user text
      if (result.ok) {
        pane.value = result.text;
        onPaneInput();
      }
      input.value = ""; // so choosing the same file again still fires "change"
    });
  }

  updateCounts();

  return { comparer, session, getOps: () => currentOps };
}

// Auto-start only on the real page. Tests import this module with an empty DOM and call
// init(document) themselves once the page markup is in place.
if (typeof document !== "undefined" && document.getElementById("compare-btn")) {
  init(document);
}

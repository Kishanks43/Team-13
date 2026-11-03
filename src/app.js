import { diffText, summarize } from "./engine/diff.js";
import { createSession } from "./engine/session.js";
import { buildMergedText } from "./engine/merge.js";
import { renderConflictList } from "./ui/conflictList.js";
import { formatProgress } from "./ui/progress.js";

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

// The note under the merged pane. Open conflicts appear there with Git-style markers (S3-04).
function describeMerge(progress) {
  if (progress.total === 0) return "No conflicts. The merged result is the same as both versions.";
  if (progress.remaining > 0) {
    const noun = progress.remaining === 1 ? "conflict is" : "conflicts are";
    return `${progress.remaining} open ${noun} shown with Git-style markers (<<<<<<<, =======, >>>>>>>). Resolve each one to remove its markers.`;
  }
  return "All conflicts resolved. You can still edit the merged result.";
}

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
  };
  session.subscribe(render);

  const comparer = createComparer({
    ...timers,
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      currentOps = ops;
      if (diffSummary) diffSummary.textContent = formatSummary(ops);
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

  const onPaneInput = () => {
    updateCounts();
    comparer.onEdit();
  };
  paneA.addEventListener("input", onPaneInput);
  paneB.addEventListener("input", onPaneInput);
  updateCounts();

  return { comparer, session, getOps: () => currentOps };
}

if (typeof document !== "undefined") init(document);

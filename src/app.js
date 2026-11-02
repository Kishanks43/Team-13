import { diffText } from "./engine/diff.js";
import { createSession } from "./engine/session.js";
import { buildMergedText } from "./engine/merge.js";
import { renderConflictList } from "./ui/conflictList.js";
import { formatProgress } from "./ui/progress.js";

export function init(doc = document) {
  const paneA = doc.getElementById("pane-a");
  const paneB = doc.getElementById("pane-b");
  const compareButton = doc.getElementById("compare-btn");
  const mergedResult = doc.getElementById("merged-result");
  const conflictCounter = doc.getElementById("conflict-counter");
  const conflictList = doc.getElementById("conflict-list");
  const countA = doc.getElementById("count-a");
  const countB = doc.getElementById("count-b");
  const mergeNote = doc.getElementById("merge-note");
  const session = createSession();
  let currentOps = [];

  const updateCounts = () => {
    countA.textContent = `${paneA.value === "" ? 0 : paneA.value.split(/\r\n|\n|\r/).length} lines`;
    countB.textContent = `${paneB.value === "" ? 0 : paneB.value.split(/\r\n|\n|\r/).length} lines`;
  };

  const render = (state) => {
    conflictCounter.textContent = formatProgress(state.progress);
    conflictList.innerHTML = renderConflictList(state.conflicts, state.resolutions, state.selectedId);
    // Rebuild only after a resolution/session change; typing in the merged pane is independent.
    mergedResult.value = buildMergedText(currentOps, state.conflicts, state.resolutions);
  };

  session.subscribe(render);

  compareButton.addEventListener("click", () => {
    currentOps = diffText(paneA.value, paneB.value);
    session.load(currentOps);
    mergeNote.textContent = "Comparison complete. Resolve conflicts or edit the merged result.";
    updateCounts();
  });

  conflictList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-id]");
    if (!button) return;
    const id = Number(button.dataset.id);
    session.resolve(id, button.dataset.action);
  });

  paneA.addEventListener("input", updateCounts);
  paneB.addEventListener("input", updateCounts);
  updateCounts();

  return { session, getOps: () => currentOps };
}

if (typeof document !== "undefined") init(document);
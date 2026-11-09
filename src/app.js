import { diffText, summarize } from "./engine/diff.js";
import { createSession } from "./engine/session.js";
import {
  buildMergedWithMarkers,
  decorateMergedModelWithGitConflictMarkers,
  detectManualEdits,
  normalizeDisplayedMerge,
  stripGitConflictMarkerLines
} from "./engine/manualEdit.js";
import { renderConflictList } from "./ui/conflictList.js";
import { formatProgress } from "./ui/progress.js";
import { downloadText, copyText } from "./ui/exportMerged.js";
import { checkMergeGuard } from "./engine/mergeGuard.js";

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

export function init(doc = document, timers = {}, exportDeps = {}) {
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
  const undoButton = doc.getElementById("undo-btn"); // optional
  const redoButton = doc.getElementById("redo-btn"); // optional
  const downloadButton = doc.getElementById("download-btn"); // optional
  const copyButton = doc.getElementById("copy-btn"); // optional
  const exportNote = doc.getElementById("export-note"); // optional
  const applyMergeButton = doc.getElementById("apply-merge-btn"); // optional (S3-07)
  const applyMergeNote = doc.getElementById("apply-merge-note"); // optional (S3-07)
  const session = createSession();
  let currentOps = [];
  // Lines the user typed for conflicts marked "manual", and where each conflict sits in the
  // merged pane. Both are rebuilt on every compare.
  let manualLines = {};
  let built = { lines: [], segments: [] };
  let shownConflicts = null;
  let shownResolutions = null;
  let marking = false;

  const updateCounts = () => {
    countA.textContent = `${lineCount(paneA.value)} lines`;
    countB.textContent = `${lineCount(paneB.value)} lines`;
  };

  // S3-07: The Apply Merge button is disabled while any conflict is open or markers remain,
  // and explains why (for example, "2 conflicts left"). It enables as soon as the last one is resolved.
  const updateApplyMergeGuard = () => {
    if (!applyMergeButton) return;
    const guard = checkMergeGuard({
      hasCompared: comparer.isLive(),
      progress: session.getState().progress,
      mergedText: mergedResult ? mergedResult.value : ""
    });
    applyMergeButton.disabled = !guard.allowed;
    applyMergeButton.setAttribute("aria-disabled", String(!guard.allowed));
    if (applyMergeNote) {
      applyMergeNote.textContent = guard.reason;
    }
  };

  // Runs on every session change (load, resolve, select). The counter updates here,
  // synchronously, so it is never behind the compare debounce.
  const render = (state) => {
    conflictCounter.textContent = formatProgress(state.progress);
    conflictList.innerHTML = renderConflictList(state.conflicts, state.resolutions, state.selectedId);
    // The merged text is rebuilt only when the conflicts or their resolutions change, so
    // selecting a conflict never wipes a hand edit. Typing in the merged pane never reaches
    // here, and nothing here ever writes to pane-a or pane-b.
    const changed = state.conflicts !== shownConflicts || state.resolutions !== shownResolutions;
    shownConflicts = state.conflicts;
    shownResolutions = state.resolutions;
    if (changed && !marking) {
      built = buildMergedWithMarkers(currentOps, state.conflicts, state.resolutions, manualLines);
      const text = built.lines.join("\n");
      if (mergedResult.value !== text) mergedResult.value = text;
    }
    if (undoButton) undoButton.disabled = !session.canUndo();
    if (redoButton) redoButton.disabled = !session.canRedo();
    updateApplyMergeGuard();
  };
  session.subscribe(render);

  const comparer = createComparer({
    ...timers,
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      currentOps = ops;
      manualLines = {};
      if (diffSummary) diffSummary.textContent = formatSummary(ops);
      session.load(ops);
      mergeNote.textContent = "Comparison complete. Resolve conflicts or edit the merged result.";
      updateApplyMergeGuard();
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

  // S2-05 decision: a hand edit changes only the merged pane. It never touches pane-a, pane-b
  // or the text of any other conflict. S3-01: a conflict the edit lands in is marked "manual",
  // so it shows a Manual badge and counts as resolved.
  mergedResult.addEventListener("input", () => {
    const result = detectManualEdits(built.lines, mergedResult.value, built.segments);

    // Replacing the whole merged pane is an unscoped pane edit, not a resolution
    // of one arbitrarily selected conflict. Keep the user's text and leave statuses
    // unchanged; the Apply Merge guard will still prevent an unresolved merge.
    if (result.wholePaneReplacement && result.edits.length === 0) {
      built = { lines: result.newLines, segments: result.segments };
      mergeNote.textContent = "Edited by hand. Inputs are untouched. Re-comparing rebuilds this text.";
      updateApplyMergeGuard();
      return;
    }

    if (result.edits.length > 0) {
      marking = true;
      try {
        for (const edit of result.edits) {
          // Marker rows are display scaffolding, not part of the saved manual text.
          manualLines[edit.id] = stripGitConflictMarkerLines(edit.lines);
          session.resolve(edit.id, "manual");
        }
      } finally {
        marking = false;
      }
    }

    // Remove the display-only open blocks, retain the contents of conflicts that
    // became Manual, then put markers back around conflicts that remain Open.
    const state = session.getState();
    const normalized = normalizeDisplayedMerge(
      result.newLines,
      result.segments,
      state.conflicts,
      state.resolutions
    );
    built = decorateMergedModelWithGitConflictMarkers(
      normalized.lines,
      normalized.segments,
      state.conflicts,
      state.resolutions
    );
    mergedResult.value = built.lines.join("\n");

    if (result.edits.length === 0) {
      mergeNote.textContent = "Edited by hand. Inputs are untouched. Re-comparing rebuilds this text.";
    } else {
      const ids = result.edits.map((edit) => edit.id).join(", ");
      mergeNote.textContent = `Edited by hand. Conflict ${ids} is now Manual. Inputs are untouched.`;
    }
    updateApplyMergeGuard();
  });

  // S3-07: Apply Merge click action.
  if (applyMergeButton) {
    applyMergeButton.addEventListener("click", () => {
      const guard = checkMergeGuard({
        hasCompared: comparer.isLive(),
        progress: session.getState().progress,
        mergedText: mergedResult.value
      });
      if (!guard.allowed) return;
      if (applyMergeNote) {
        applyMergeNote.textContent = "Merge applied successfully.";
      }
      if (exportNote) {
        exportNote.textContent = "Merge applied. Ready to download or copy.";
      }
    });
  }

  // S3-08: the file and the clipboard get exactly what the Merged Result pane holds.
  const say = (result) => {
    if (exportNote) exportNote.textContent = result.message;
  };
  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      say(downloadText(mergedResult.value, { doc, ...exportDeps }));
    });
  }
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      say(await copyText(mergedResult.value, { doc, ...exportDeps }));
    });
  }

  if (undoButton) undoButton.addEventListener("click", () => session.undo());
  if (redoButton) redoButton.addEventListener("click", () => session.redo());

  const onPaneInput = () => {
    updateCounts();
    comparer.onEdit();
  };
  paneA.addEventListener("input", onPaneInput);
  paneB.addEventListener("input", onPaneInput);
  updateCounts();
  updateApplyMergeGuard();

  return { comparer, session, getOps: () => currentOps, updateApplyMergeGuard };
}

// Auto-start only on the real page. Tests import this module with an empty DOM and call
// init(document) themselves once the page markup is in place.
if (typeof document !== "undefined" && document.getElementById("compare-btn")) {
  init(document);
}

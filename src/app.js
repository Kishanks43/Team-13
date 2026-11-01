
/**
 * Page wiring: the Compare button, live re-compare after edits, and sample loading.
 * The logic lives in createComparer() so it can be tested without a browser.
 */
import { diffText, summarize } from "./engine/diff.js";
import { buildRows, renderSideBySideWithConflicts } from "./ui/diffView.js";
import { samples, getSample } from "./samples.js";
import { describeLines } from "./ui/paneInfo.js";
import { loadFile } from "./fileLoader.js";
import { createSession } from "./engine/session.js";
import { formatProgress } from "./ui/progress.js";
import { renderConflictList } from "./ui/conflictList.js";
import { nextConflictId, prevConflictId, scrollConflictIntoView } from "./ui/conflictNav.js";
import { isTextEntry, undoRedoAction } from "./ui/undoKeys.js";

/**
 * compare() runs the diff now and switches on "live" mode.
 * onEdit() calls it after every edit; once live, it re-runs the diff
 * shortly after the user stops typing.
 */
export function createComparer({
  getA,
  getB,
  render,
  delay = 300,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let live = false;
  let timer = null;

  function compare() {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }

    live = true;
    const ops = diffText(getA(), getB());
    render(ops);
    return ops;
  }

  function onEdit() {
    if (!live) return;

    if (timer !== null) {
      clearTimer(timer);
    }

    timer = setTimer(() => {
      timer = null;
      compare();
    }, delay);
  }

  return { compare, onEdit, isLive: () => live };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One-line summary such as "2 lines added, 1 line removed, 14 unchanged". */
export function formatSummary(ops) {
  const { added, removed, unchanged } = summarize(ops);

  if (added === 0 && removed === 0) {
    return "The two versions are identical.";
  }

  return `${plural(added, "line")} added, ${plural(
    removed,
    "line"
  )} removed, ${unchanged} unchanged`;
}

/** Connect the page elements to the logic above. */
export function init(doc) {
  const paneA = doc.getElementById("pane-a");
  const paneB = doc.getElementById("pane-b");
  const output = doc.getElementById("diff-output");
  const summary = doc.getElementById("diff-summary");
  const compareBtn = doc.getElementById("compare-btn");
  const sampleSelect = doc.getElementById("sample-select");
  const loadSampleBtn = doc.getElementById("load-sample-btn");

  // The session holds the conflicts and what has been decided about each. The counter follows it.
  const counter = doc.getElementById("conflict-counter");
  const session = createSession();
  const conflictList = doc.getElementById("conflict-list");

  /**
   * Apply the conflict-selected CSS class to the diff row that starts the
   * currently selected conflict, and scroll the diff output and conflict list
   * to bring that row into view.
   */
  function applySelectionHighlight(state) {
    // Remove any existing highlight.
    for (const el of output.querySelectorAll(".conflict-selected")) {
      el.classList.remove("conflict-selected");
    }

    if (state.selectedId === null) return;

    // Highlight the diff row and scroll the diff pane.
    const diffRow = output.querySelector(`[data-conflict-id="${state.selectedId}"]`);
    if (diffRow) {
      diffRow.classList.add("conflict-selected");
      scrollConflictIntoView(output, diffRow);
    }

    // Scroll the conflict list to the selected item.
    const listItem = conflictList.querySelector(`[data-conflict-id="${state.selectedId}"]`);
    scrollConflictIntoView(conflictList, listItem);

    // Scroll the merged result pane if it exists (added by S2-05).
    const mergedEl = doc.getElementById("merged-result");
    if (mergedEl) {
      const mergedRow = mergedEl.querySelector(`[data-conflict-id="${state.selectedId}"]`);
      scrollConflictIntoView(mergedEl, mergedRow);
    }
  }

  const undoBtn = doc.getElementById("undo-btn");
  const redoBtn = doc.getElementById("redo-btn");

  function syncHistoryButtons(state) {
    if (undoBtn) undoBtn.disabled = !state.canUndo;
    if (redoBtn) redoBtn.disabled = !state.canRedo;
  }

  session.subscribe((state) => {
    counter.textContent = formatProgress(state.progress);
    conflictList.innerHTML = renderConflictList(state.conflicts, state.resolutions, state.selectedId);
    applySelectionHighlight(state);
    syncHistoryButtons(state);
  });

  // Clicking a conflict in the list selects it. The list is redrawn, so put the keyboard focus back.
  conflictList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-conflict-id]");
    if (!item) return;
    const id = Number(item.dataset.conflictId);
    session.select(id);
    const again = conflictList.querySelector(`[data-conflict-id="${id}"]`);
    if (again) again.focus();
  });

  // Prev / Next buttons.
  const prevBtn = doc.getElementById("prev-conflict-btn");
  const nextBtn = doc.getElementById("next-conflict-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const { conflicts, selectedId } = session.getState();
      const id = prevConflictId(conflicts, selectedId);
      if (id !== null) session.select(id);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const { conflicts, selectedId } = session.getState();
      const id = nextConflictId(conflicts, selectedId);
      if (id !== null) session.select(id);
    });
  }

  if (undoBtn) {
    undoBtn.addEventListener("click", () => session.undo());
  }

  if (redoBtn) {
    redoBtn.addEventListener("click", () => session.redo());
  }

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z = redo,
  // [ = prev, ] = next. All are suppressed inside text fields, which keep their own undo.
  doc.addEventListener("keydown", (event) => {
    const historyAction = undoRedoAction(event);

    if (historyAction === "undo") {
      event.preventDefault();
      session.undo();
      return;
    }

    if (historyAction === "redo") {
      event.preventDefault();
      session.redo();
      return;
    }

    if (isTextEntry(event.target)) return;

    if (event.key === "[") {
      const { conflicts, selectedId } = session.getState();
      const id = prevConflictId(conflicts, selectedId);
      if (id !== null) session.select(id);
    } else if (event.key === "]") {
      const { conflicts, selectedId } = session.getState();
      const id = nextConflictId(conflicts, selectedId);
      if (id !== null) session.select(id);
    }
  });

  const comparer = createComparer({
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      // Use the conflicts-aware renderer so rows get data-conflict-id attributes.
      const rows = buildRows(ops);
      // Load session first so we have the conflicts available.
      session.load(ops);
      const { conflicts } = session.getState();
      output.innerHTML = renderSideBySideWithConflicts(rows, conflicts);
      summary.textContent = formatSummary(ops);
      // Auto-select conflict 1 so the user can immediately start navigating.
      if (conflicts.length > 0) {
        session.select(conflicts[0].id);
      }
    },
  });

  for (const sample of samples) {
    const option = doc.createElement("option");
    option.value = sample.id;
    option.textContent = sample.name;
    sampleSelect.appendChild(option);
  }

  // Each pane shows its current line count.
  const countA = doc.getElementById("count-a");
  const countB = doc.getElementById("count-b");

  function updateCounts() {
    countA.textContent = describeLines(paneA.value);
    countB.textContent = describeLines(paneB.value);
  }

  updateCounts();

  compareBtn.addEventListener("click", comparer.compare);

  for (const pane of [paneA, paneB]) {
    pane.addEventListener("input", () => {
      updateCounts();
      comparer.onEdit();
    });
  }

  // Load a file into the selected pane.
  function wireFileLoading(pane, button, input, note) {
    button.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];

      // Allow the same file to be selected again later.
      input.value = "";

      if (!file) return;

      try {
        const result = await loadFile(file);

        note.classList.toggle("error", !result.ok);

        if (!result.ok) {
          note.textContent = result.error;
          return;
        }

        pane.value = result.text;
        note.textContent = `Loaded ${result.name}`;

        updateCounts();
        comparer.onEdit();
      } catch (error) {
        note.classList.add("error");
        note.textContent =
          error instanceof Error
            ? error.message
            : "Unable to load this file.";
      }
    });
  }

  wireFileLoading(
    paneA,
    doc.getElementById("load-a-btn"),
    doc.getElementById("file-a"),
    doc.getElementById("note-a")
  );

  wireFileLoading(
    paneB,
    doc.getElementById("load-b-btn"),
    doc.getElementById("file-b"),
    doc.getElementById("note-b")
  );

  // Load the selected built-in sample.
  loadSampleBtn.addEventListener("click", () => {
    const sample = getSample(sampleSelect.value);

    if (!sample) return;

    paneA.value = sample.a;
    paneB.value = sample.b;

    updateCounts();
    comparer.compare();
  });

  return { comparer, session };
}

if (typeof document !== "undefined") {
  init(document);
}

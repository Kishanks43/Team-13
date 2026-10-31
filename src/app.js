
/**
 * Page wiring: the Compare button, live re-compare after edits, and sample loading.
 * The logic lives in createComparer() so it can be tested without a browser.
 */
import { diffText, summarize } from "./engine/diff.js";
import { buildRows, renderSideBySide } from "./ui/diffView.js";
import { samples, getSample } from "./samples.js";
import { describeLines } from "./ui/paneInfo.js";
import { loadFile } from "./fileLoader.js";
import { createSession } from "./engine/session.js";
import { formatProgress } from "./ui/progress.js";

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
  session.subscribe((state) => {
    counter.textContent = formatProgress(state.progress);
  });

  const comparer = createComparer({
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      output.innerHTML = renderSideBySide(buildRows(ops));
      summary.textContent = formatSummary(ops);
      session.load(ops);
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

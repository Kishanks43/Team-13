/**
 * Page wiring: the Compare button, live re-compare after edits, and sample loading.
 * The logic lives in createComparer() so it can be tested without a browser.
 */
import { diffText, summarize } from "./engine/diff.js";
import { buildRows, renderSideBySide } from "./ui/diffView.js";
import { samples, getSample } from "./samples.js";
import { describeLines } from "./ui/paneInfo.js";

/**
 * compare()  runs the diff now and switches on "live" mode.
 * onEdit()   call it after every edit; once live, it re-runs the diff shortly after the user stops typing.
 */
export function createComparer({ getA, getB, render, delay = 300, setTimer = setTimeout, clearTimer = clearTimeout }) {
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
    if (timer !== null) clearTimer(timer);
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
  if (added === 0 && removed === 0) return "The two versions are identical.";
  return `${plural(added, "line")} added, ${plural(removed, "line")} removed, ${unchanged} unchanged`;
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

  const comparer = createComparer({
    getA: () => paneA.value,
    getB: () => paneB.value,
    render: (ops) => {
      output.innerHTML = renderSideBySide(buildRows(ops));
      summary.textContent = formatSummary(ops);
    },
  });

  for (const sample of samples) {
    const option = doc.createElement("option");
    option.value = sample.id;
    option.textContent = sample.name;
    sampleSelect.appendChild(option);
  }

  // Each pane shows how many lines it holds, and keeps it current as the text changes.
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

  loadSampleBtn.addEventListener("click", () => {
    const sample = getSample(sampleSelect.value);
    if (!sample) return;
    paneA.value = sample.a;
    paneB.value = sample.b;
    updateCounts();
    comparer.compare();
  });
}

if (typeof document !== "undefined") init(document);

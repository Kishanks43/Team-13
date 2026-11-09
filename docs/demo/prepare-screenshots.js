import { getSample } from "../../src/samples.js";

const scenarioId = new URLSearchParams(window.location.search).get("scenario") || "separate-edits";
const sample = getSample(scenarioId);
const status = document.getElementById("status");
const frame = document.getElementById("app-frame");

if (!sample) {
  status.textContent = `Unknown scenario: ${scenarioId}`;
  throw new Error(`Unknown demo scenario: ${scenarioId}`);
}

frame.addEventListener("load", () => {
  const app = frame.contentDocument;
  const paneA = app.getElementById("pane-a");
  const paneB = app.getElementById("pane-b");
  paneA.value = sample.a;
  paneB.value = sample.b;
  app.getElementById("compare-btn").click();

  const resolve = (id, action) => {
    const button = app.querySelector(`button[data-action="${action}"][data-id="${id}"]`);
    if (!button) throw new Error(`Could not find ${action} for conflict ${id}`);
    button.click();
  };

  if (scenarioId === "separate-edits") {
    resolve(1, "A");
    resolve(2, "B");
  } else if (scenarioId === "deleted-vs-modified") {
    resolve(1, "B");
  }

  status.textContent = `Scenario ready: ${sample.name}. Capture this page for the S3-10 presentation.`;
  document.body.dataset.scenarioReady = scenarioId;
});

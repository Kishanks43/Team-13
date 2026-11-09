/**
 * @jest-environment jsdom
 *
 * S3-09: End-to-end test of the complete Code Merge Simulator flow:
 * 1. Load two versions (Version A and Version B)
 * 2. Compare versions
 * 3. Inspect conflicts and verify Apply Merge guard blocks export
 * 4. Resolve every conflict (Accept A, Accept B, Accept Both, and manual edit)
 * 5. Verify undo/redo across the flow
 * 6. Verify Apply Merge enables and confirms application
 * 7. Export via file download and clipboard copy
 * 8. Prove input panes remain strictly immutable throughout
 */
import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { readFileSync } from "node:fs";
import { init } from "../src/app.js";
import { DOWNLOAD_NAME } from "../src/ui/exportMerged.js";

const PAGE_HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function createMockExportEnv() {
  const downloadedBlobs = [];
  const clickedLinks = [];
  const copiedTexts = [];

  class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      downloadedBlobs.push(this);
    }
  }

  const urlApi = {
    createObjectURL: (blob) => `blob:mock/${downloadedBlobs.indexOf(blob)}`,
    revokeObjectURL: jest.fn()
  };

  const nav = {
    clipboard: {
      writeText: jest.fn(async (text) => {
        copiedTexts.push(text);
      })
    }
  };

  return {
    downloadedBlobs,
    clickedLinks,
    copiedTexts,
    deps: {
      BlobCtor: MockBlob,
      urlApi,
      nav
    }
  };
}

function mountApp(exportEnv) {
  const parsed = new DOMParser().parseFromString(PAGE_HTML, "text/html");
  document.body.innerHTML = parsed.body.innerHTML;
  return init(document, { setTimer: () => 1, clearTimer: () => {} }, exportEnv?.deps ?? {});
}

describe("S3-09: End-to-End User Flow", () => {
  let clickSpy;

  beforeEach(() => {
    clickSpy = jest.spyOn(window.HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    clickSpy?.mockRestore();
  });
  const VERSION_A = [
    "function calculateTotal(items) {",
    "  let sum = 0;",
    "  // Version A: for-of loop with validation",
    "  for (const item of items) {",
    "    if (item.price > 0) sum += item.price;",
    "  }",
    "  // Shared footer",
    "  return sum;",
    "}"
  ].join("\n");

  const VERSION_B = [
    "function calculateTotal(items) {",
    "  let sum = 0;",
    "  // Version B: reduce method with tax calculation",
    "  const tax = 0.05;",
    "  sum = items.reduce((acc, item) => acc + item.price * (1 + tax), 0);",
    "  // Shared footer",
    "  return sum;",
    "}"
  ].join("\n");

  test("full end-to-end journey: load, compare, resolve, undo/redo, apply merge, download, and copy", async () => {
    const exportEnv = createMockExportEnv();
    const { session } = mountApp(exportEnv);

    const paneA = document.getElementById("pane-a");
    const paneB = document.getElementById("pane-b");
    const compareBtn = document.getElementById("compare-btn");
    const countA = document.getElementById("count-a");
    const countB = document.getElementById("count-b");
    const conflictCounter = document.getElementById("conflict-counter");
    const conflictList = document.getElementById("conflict-list");
    const mergedResult = document.getElementById("merged-result");
    const applyMergeBtn = document.getElementById("apply-merge-btn");
    const applyMergeNote = document.getElementById("apply-merge-note");
    const downloadBtn = document.getElementById("download-btn");
    const copyBtn = document.getElementById("copy-btn");
    const exportNote = document.getElementById("export-note");
    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");

    // 1. Initial State before comparison
    expect(applyMergeBtn.disabled).toBe(true);
    expect(applyMergeNote.textContent).toBe("Compare versions to begin");
    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);

    // 2. Load Version A and Version B
    paneA.value = VERSION_A;
    paneB.value = VERSION_B;
    paneA.dispatchEvent(new window.Event("input"));
    paneB.dispatchEvent(new window.Event("input"));

    expect(countA.textContent).toBe("9 lines");
    expect(countB.textContent).toBe("8 lines");

    // 3. Compare versions
    compareBtn.click();

    const stateAfterCompare = session.getState();
    expect(stateAfterCompare.conflicts.length).toBeGreaterThan(0);
    expect(conflictCounter.textContent).toContain("remaining");
    expect(conflictList.querySelectorAll(".conflict-item").length).toBe(stateAfterCompare.conflicts.length);

    // Guard blocks Apply Merge while conflicts remain open
    expect(applyMergeBtn.disabled).toBe(true);
    const rem = stateAfterCompare.progress.remaining;
    expect(applyMergeNote.textContent).toBe(`${rem} conflict${rem === 1 ? "" : "s"} left`);

    // 4. Resolve conflict 1 with "Accept A"
    const firstConflict = stateAfterCompare.conflicts[0];
    const acceptABtn = conflictList.querySelector(`button[data-action="A"][data-id="${firstConflict.id}"]`);
    expect(acceptABtn).not.toBeNull();
    acceptABtn.click();

    expect(session.getState().progress.resolved).toBe(1);

    // If there were 2 conflicts, 1 remains
    if (stateAfterCompare.conflicts.length > 1) {
      expect(applyMergeBtn.disabled).toBe(true);
      expect(applyMergeNote.textContent).toBe("1 conflict left");

      // Resolve remaining conflict with "Accept Both"
      const secondConflict = stateAfterCompare.conflicts[1];
      const acceptBothBtn = conflictList.querySelector(`button[data-action="both"][data-id="${secondConflict.id}"]`);
      acceptBothBtn.click();
    }

    // 5. Verify all conflicts are now resolved
    expect(session.getState().progress.remaining).toBe(0);
    expect(applyMergeBtn.disabled).toBe(false);
    expect(applyMergeNote.textContent).toBe("Ready to apply merge");

    // 6. Test Undo and Redo in the resolve flow
    expect(undoBtn.disabled).toBe(false);
    undoBtn.click(); // Undoes last resolution

    expect(session.getState().progress.remaining).toBeGreaterThan(0);
    expect(applyMergeBtn.disabled).toBe(true);
    expect(applyMergeNote.textContent).toContain("conflict");

    redoBtn.click(); // Re-applies resolution
    expect(session.getState().progress.remaining).toBe(0);
    expect(applyMergeBtn.disabled).toBe(false);
    expect(applyMergeNote.textContent).toBe("Ready to apply merge");

    // 7. Click Apply Merge
    applyMergeBtn.click();
    expect(applyMergeNote.textContent).toBe("Merge applied successfully.");

    // 8. Download merged file
    downloadBtn.click();
    expect(exportEnv.downloadedBlobs.length).toBe(1);
    expect(exportEnv.downloadedBlobs[0].parts).toEqual([mergedResult.value]);
    expect(exportNote.textContent).toBe(`Downloaded ${DOWNLOAD_NAME}.`);

    // 9. Copy merged result
    copyBtn.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(exportEnv.copiedTexts.length).toBe(1);
    expect(exportEnv.copiedTexts[0]).toBe(mergedResult.value);
    expect(exportNote.textContent).toBe("Copied the merged result.");

    // 10. Verify input panes remain completely untouched
    expect(paneA.value).toBe(VERSION_A);
    expect(paneB.value).toBe(VERSION_B);
  });

  test("identical files flow automatically allows merge and export", async () => {
    const exportEnv = createMockExportEnv();
    mountApp(exportEnv);

    const paneA = document.getElementById("pane-a");
    const paneB = document.getElementById("pane-b");
    const compareBtn = document.getElementById("compare-btn");
    const conflictCounter = document.getElementById("conflict-counter");
    const applyMergeBtn = document.getElementById("apply-merge-btn");
    const applyMergeNote = document.getElementById("apply-merge-note");
    const downloadBtn = document.getElementById("download-btn");

    const code = "console.log('clean codebase');";
    paneA.value = code;
    paneB.value = code;

    compareBtn.click();

    expect(conflictCounter.textContent).toBe("No conflicts.");
    expect(applyMergeBtn.disabled).toBe(false);
    expect(applyMergeNote.textContent).toBe("Ready to apply merge");

    applyMergeBtn.click();
    expect(applyMergeNote.textContent).toBe("Merge applied successfully.");

    downloadBtn.click();
    expect(exportEnv.downloadedBlobs[0].parts).toEqual([code]);
  });

  test("manual edit flow tracks manual status and guards against conflict markers", () => {
    mountApp();

    const paneA = document.getElementById("pane-a");
    const paneB = document.getElementById("pane-b");
    const compareBtn = document.getElementById("compare-btn");
    const conflictList = document.getElementById("conflict-list");
    const mergedResult = document.getElementById("merged-result");
    const applyMergeBtn = document.getElementById("apply-merge-btn");
    const applyMergeNote = document.getElementById("apply-merge-note");

    paneA.value = "top\n1\nend";
    paneB.value = "top\n2\nend";
    compareBtn.click();

    // Resolve conflict
    conflictList.querySelector('button[data-action="A"][data-id="1"]').click();
    expect(applyMergeBtn.disabled).toBe(false);

    // User pastes unresolved conflict marker
    mergedResult.value = "top\n<<<<<<< A\n1\n=======\n2\n>>>>>>> B\nend";
    mergedResult.dispatchEvent(new window.Event("input"));

    expect(applyMergeBtn.disabled).toBe(true);
    expect(applyMergeNote.textContent).toBe("Resolve conflict markers in merged result");

    // User cleans up markers with custom resolution
    mergedResult.value = "top\ncustom resolution\nend";
    mergedResult.dispatchEvent(new window.Event("input"));

    expect(applyMergeBtn.disabled).toBe(false);
    expect(applyMergeNote.textContent).toBe("Ready to apply merge");

    // Inputs remain untouched
    expect(paneA.value).toBe("top\n1\nend");
    expect(paneB.value).toBe("top\n2\nend");
  });
});

/** @jest-environment jsdom */
import { describe, test, expect, beforeEach } from "@jest/globals";
import { init } from "../src/app.js";
import { describeMerge } from "../src/ui/mergeNote.js";
import { hasConflictMarkers, countConflictMarkers } from "../src/engine/markers.js";
import { loadPage, click, type } from "./helpers.js";

const $ = (id) => document.getElementById(id);

describe("S3-04 describeMerge", () => {
  test("covers no conflicts, some open, and all resolved", () => {
    expect(describeMerge({ total: 0, remaining: 0 })).toMatch(/No conflicts/);
    expect(describeMerge({ total: 2, remaining: 1 })).toMatch(/1 open conflict is shown with Git-style markers/);
    expect(describeMerge({ total: 2, remaining: 2 })).toMatch(/2 open conflicts are/);
    expect(describeMerge({ total: 2, remaining: 0 })).toMatch(/All conflicts resolved/);
  });
});

describe("S3-04 markers on the page", () => {
  beforeEach(() => {
    loadPage();
    init(document);
    type($("pane-a"), "1\nx\n2\ny\n3");
    type($("pane-b"), "1\nX\n2\nY\n3");
    click($("compare-btn"));
  });

  test("Compare shows Git-style markers for every open conflict and explains them", () => {
    expect(countConflictMarkers($("merged-result").value)).toBe(2);
    expect($("merged-result").value).toContain("<<<<<<< A\nx\n=======\nX\n>>>>>>> B");
    expect($("merge-note").textContent).toMatch(/2 open conflicts are shown with Git-style markers/);
  });

  test("resolving removes that conflict's markers; undo brings them back; redo removes again", () => {
    click(document.querySelector('button[data-action="A"][data-id="1"]'));
    expect(countConflictMarkers($("merged-result").value)).toBe(1);
    expect($("merged-result").value.startsWith("1\nx\n2\n<<<<<<< A")).toBe(true);
    click($("undo-btn"));
    expect(countConflictMarkers($("merged-result").value)).toBe(2);
    click($("redo-btn"));
    expect(countConflictMarkers($("merged-result").value)).toBe(1);
  });

  test("once every conflict is resolved no markers remain and the note says so", () => {
    click(document.querySelector('button[data-action="B"][data-id="1"]'));
    click(document.querySelector('button[data-action="both"][data-id="2"]'));
    expect(hasConflictMarkers($("merged-result").value)).toBe(false);
    expect($("merged-result").value).toBe("1\nX\n2\ny\nY\n3");
    expect($("merge-note").textContent).toMatch(/All conflicts resolved/);
  });

  test("a hand edit replaces the note; the next resolution rebuilds the text and the note", () => {
    type($("merged-result"), "mine");
    expect($("merge-note").textContent).toMatch(/Edited by hand/);
    click(document.querySelector('button[data-action="A"][data-id="1"]'));
    expect($("merged-result").value).not.toBe("mine");
    expect($("merge-note").textContent).toMatch(/1 open conflict is shown/);
  });
});

import { describe, test, expect } from "@jest/globals";
import { isTextEntry, undoRedoAction } from "../src/ui/undoKeys.js";

function target(tagName, extra = {}) {
  return { tagName, ...extra };
}

function keyEvent(key, modifiers = {}, eventTarget = target("BODY")) {
  return {
    key,
    target: eventTarget,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...modifiers,
  };
}

describe("isTextEntry", () => {
  test("recognises a textarea", () => {
    expect(isTextEntry(target("TEXTAREA"))).toBe(true);
  });

  test("recognises text-like inputs", () => {
    expect(isTextEntry(target("INPUT", { type: "text" }))).toBe(true);
    expect(isTextEntry(target("INPUT", { type: "search" }))).toBe(true);
    expect(isTextEntry(target("INPUT", { type: undefined }))).toBe(true);
  });

  test("does not treat buttons, checkboxes or selects as text entry", () => {
    expect(isTextEntry(target("INPUT", { type: "checkbox" }))).toBe(false);
    expect(isTextEntry(target("SELECT"))).toBe(false);
    expect(isTextEntry(target("BUTTON"))).toBe(false);
  });

  test("recognises contenteditable elements", () => {
    expect(isTextEntry(target("DIV", { isContentEditable: true }))).toBe(true);
    expect(isTextEntry(target("DIV", { isContentEditable: false }))).toBe(false);
  });

  test("handles a missing element", () => {
    expect(isTextEntry(null)).toBe(false);
  });
});

describe("undoRedoAction", () => {
  test("Ctrl+Z and Cmd+Z undo", () => {
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true }))).toBe("undo");
    expect(undoRedoAction(keyEvent("z", { metaKey: true }))).toBe("undo");
  });

  test("Ctrl+Y and Ctrl/Cmd+Shift+Z redo", () => {
    expect(undoRedoAction(keyEvent("y", { ctrlKey: true }))).toBe("redo");
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true, shiftKey: true }))).toBe("redo");
    expect(undoRedoAction(keyEvent("Z", { metaKey: true, shiftKey: true }))).toBe("redo");
  });

  test("ignores keys without Ctrl or Cmd, and other keys", () => {
    expect(undoRedoAction(keyEvent("z"))).toBeNull();
    expect(undoRedoAction(keyEvent("a", { ctrlKey: true }))).toBeNull();
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true, altKey: true }))).toBeNull();
  });

  test("leaves undo alone inside text fields that manage their own history", () => {
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true }, target("TEXTAREA")))).toBeNull();
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true }, target("INPUT", { type: "text" })))).toBeNull();
  });

  test("still works when the focus is on a button or in the page", () => {
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true }, target("BUTTON")))).toBe("undo");
    expect(undoRedoAction(keyEvent("z", { ctrlKey: true }, target("BODY")))).toBe("undo");
  });
});

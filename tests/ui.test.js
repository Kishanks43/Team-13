import { describe, test, expect } from "@jest/globals";
import { escapeHtml, buildRows, renderSideBySide } from "../src/ui/diffView.js";
import { renderConflictList } from "../src/ui/conflictList.js";
import { formatProgress } from "../src/ui/progress.js";
import { formatLineCount, formatLoadNote } from "../src/ui/paneInfo.js";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";

describe("diffView", () => {
  test("escapes HTML in user text", () => {
    expect(escapeHtml(`<img src=x onerror="a()">&'`)).toBe("&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;");
    const html = renderSideBySide(buildRows(diffText("<script>alert(1)</script>", "ok")));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
  test("changed pairs share a row; extras become add or remove rows", () => {
    expect(buildRows(diffText("a\nb\nc", "a\nX")).map((r) => r.type)).toEqual(["equal", "change", "remove"]);
    expect(buildRows(diffText("a", "a\nb")).map((r) => r.type)).toEqual(["equal", "add"]);
  });
  test("rows carry +, - and ~ markers so colour is never the only signal", () => {
    const html = renderSideBySide(buildRows(diffText("a", "b")));
    expect(html).toContain("~");
  });
});

describe("conflictList", () => {
  const conflicts = findConflicts(diffText("a\nb\nc", "a\nB\nc"));
  test("renders buttons with the attributes app.js listens for", () => {
    const html = renderConflictList(conflicts, {}, null);
    expect(html).toContain('data-conflict-id="1"');
    expect(html).toContain('data-action="A" data-id="1"');
    expect(html).toContain('data-action="both" data-id="1"');
    expect(html).toContain("Status: Open");
  });
  test("shows the chosen status as text", () => {
    expect(renderConflictList(conflicts, { 1: "B" }, 1)).toContain("Status: B");
  });
  test("empty list message", () => expect(renderConflictList([], {}, null)).toContain("No conflicts"));
});

describe("small formatters", () => {
  test("progress", () => {
    expect(formatProgress({ total: 0, resolved: 0, remaining: 0 })).toBe("No conflicts");
    expect(formatProgress({ total: 3, resolved: 1, remaining: 2 })).toBe("3 total · 1 resolved · 2 remaining");
  });
  test("line count and load note", () => {
    expect(formatLineCount(1)).toBe("1 line");
    expect(formatLineCount(2)).toBe("2 lines");
    expect(formatLoadNote({ ok: true, name: "a.js" })).toBe("Loaded a.js.");
    expect(formatLoadNote({ ok: false, name: "b.bin", error: "bad" })).toBe("Could not load b.bin: bad");
  });
});

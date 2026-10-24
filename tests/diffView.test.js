import { describe, test, expect } from "@jest/globals";
import { diffLines } from "../src/engine/diff.js";
import { buildRows, renderSideBySide, escapeHtml } from "../src/ui/diffView.js";

const rowsFor = (a, b) => buildRows(diffLines(a, b));
const kinds = (rows) => rows.map((r) => r.kind);

describe("buildRows", () => {
  test("unchanged lines sit side by side with matching line numbers", () => {
    const rows = rowsFor(["a", "b"], ["a", "b"]);
    expect(kinds(rows)).toEqual(["equal", "equal"]);
    expect(rows[1].left).toEqual({ num: 2, text: "b" });
    expect(rows[1].right).toEqual({ num: 2, text: "b" });
    expect(rows[0].marker).toBe(" ");
  });

  test("a changed line shows the old text on the left and the new text on the right", () => {
    const rows = rowsFor(["a", "b", "c"], ["a", "B", "c"]);
    expect(kinds(rows)).toEqual(["equal", "changed", "equal"]);
    expect(rows[1].left).toEqual({ num: 2, text: "b" });
    expect(rows[1].right).toEqual({ num: 2, text: "B" });
    expect(rows[1].marker).toBe("~");
  });

  test("a line only in A is marked removed with an empty right side", () => {
    const rows = rowsFor(["a", "b", "c"], ["a", "c"]);
    expect(kinds(rows)).toEqual(["equal", "removed", "equal"]);
    expect(rows[1].right).toBeNull();
    expect(rows[1].marker).toBe("-");
  });

  test("a line only in B is marked added with an empty left side", () => {
    const rows = rowsFor(["a", "c"], ["a", "b", "c"]);
    expect(kinds(rows)).toEqual(["equal", "added", "equal"]);
    expect(rows[1].left).toBeNull();
    expect(rows[1].marker).toBe("+");
  });

  test("uneven changes pair up first and leave the extras alone", () => {
    // 3 lines removed, 1 line added: one changed row, then two removed rows.
    const rows = rowsFor(["x", "p", "q", "r", "y"], ["x", "P", "y"]);
    expect(kinds(rows)).toEqual(["equal", "changed", "removed", "removed", "equal"]);
    expect(rows[2].left).toEqual({ num: 3, text: "q" });
    expect(rows[4].left).toEqual({ num: 5, text: "y" });
    expect(rows[4].right).toEqual({ num: 3, text: "y" });
  });

  test("two empty inputs give no rows", () => {
    expect(rowsFor([], [])).toEqual([]);
  });
});

describe("renderSideBySide", () => {
  test("every changed row has a highlight class and a text marker", () => {
    const html = renderSideBySide(rowsFor(["a", "b", "c", "d"], ["a", "B", "c"]));
    expect(html).toContain("diff-changed");
    expect(html).toContain(">~<");
    expect(html).toContain("diff-removed");
    expect(html).toContain(">-<");
  });

  test("unchanged rows have neither highlight nor marker text", () => {
    const html = renderSideBySide(rowsFor(["a", "b"], ["a", "b"]));
    expect(html).toContain("diff-equal");
    expect(html).not.toContain("diff-changed");
    expect(html).not.toMatch(/>[~+-]</);
  });

  test("sets column widths with a colgroup so the table lines up", () => {
    expect(renderSideBySide([])).toContain("<colgroup>");
  });

  test("shows both column headings", () => {
    const html = renderSideBySide([]);
    expect(html).toContain("Version A");
    expect(html).toContain("Version B");
  });

  test("pasted code is escaped and never becomes real HTML", () => {
    const html = renderSideBySide(rowsFor(["<script>alert(1)</script>"], ['<img src=x onerror="alert(1)">']));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot;alert(1)&quot;");
  });
});

describe("escapeHtml", () => {
  test("escapes the five special characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });
  test("leaves ordinary text alone", () => {
    expect(escapeHtml("let x = 1;")).toBe("let x = 1;");
  });
});

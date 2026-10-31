import { describe, test, expect } from "@jest/globals";
import { renderConflictList, describeSide } from "../src/ui/conflictList.js";
import { createSession } from "../src/engine/session.js";
import { diffText } from "../src/engine/diff.js";

const A = "one\ntwo\nthree\nfour\nfive\nsix\nseven";
const B = "ONE\ntwo\nthree\nFOUR\nfive\nsix\nSEVEN";

function state(setup) {
  const session = createSession();
  session.load(diffText(A, B));
  if (setup) setup(session);
  return session.getState();
}

const render = (s) => renderConflictList(s.conflicts, s.resolutions, s.selectedId);
const count = (html, pattern) => (html.match(pattern) || []).length;

describe("describeSide", () => {
  test("no lines, one line and several lines", () => {
    expect(describeSide("A", 3, 0)).toBe("A: none");
    expect(describeSide("B", 7, 1)).toBe("B: line 7");
    expect(describeSide("A", 3, 4)).toBe("A: lines 3-6");
  });
});

describe("renderConflictList", () => {
  test("shows one item per conflict", () => {
    const html = render(state());
    expect(count(html, /class="conflict-item/g)).toBe(3);
    expect(html).toContain("Conflict 1");
    expect(html).toContain("Conflict 3");
  });

  test("every conflict starts as Open", () => {
    const html = render(state());
    expect(count(html, /<span class="conflict-status">Open<\/span>/g)).toBe(3);
  });

  test("each conflict shows Open, A, B or Both as decided", () => {
    const html = render(
      state((s) => {
        s.resolve(1, "A");
        s.resolve(2, "B");
        s.resolve(3, "both");
      })
    );
    expect(html).toContain('<span class="conflict-status">A</span>');
    expect(html).toContain('<span class="conflict-status">B</span>');
    expect(html).toContain('<span class="conflict-status">Both</span>');
    expect(html).not.toContain(">Open<");
  });

  test("a hand-edited conflict shows Manual", () => {
    expect(render(state((s) => s.resolve(2, "manual")))).toContain('<span class="conflict-status">Manual</span>');
  });

  test("a mix shows the right status on the right conflict", () => {
    const html = render(state((s) => s.resolve(2, "B")));
    expect(html).toMatch(/data-conflict-id="1"[^>]*>.*?Open/);
    expect(html).toMatch(/data-conflict-id="2"[^>]*>.*?<span class="conflict-status">B<\/span>/);
  });

  test("shows where each conflict is", () => {
    const html = render(state());
    expect(html).toContain("A: line 1, B: line 1");
    expect(html).toContain("A: line 4, B: line 4");
  });

  test("marks only the selected conflict as current", () => {
    const html = render(state((s) => s.select(2)));
    expect(count(html, /aria-current="true"/g)).toBe(1);
    expect(html).toMatch(/data-conflict-id="2" aria-current="true"/);
  });

  test("nothing is marked current when none is selected", () => {
    expect(render(state())).not.toContain("aria-current");
  });

  test("says so when there are no conflicts", () => {
    expect(renderConflictList([], {}, null)).toContain("No conflicts to list.");
  });

  test("describes pure additions and deletions", () => {
    const added = createSession();
    added.load(diffText("a\nc", "a\nb\nc"));
    expect(render(added.getState())).toContain("A: none, B: line 2");

    const removed = createSession();
    removed.load(diffText("a\nb\nc", "a\nc"));
    expect(render(removed.getState())).toContain("A: line 2, B: none");
  });
});

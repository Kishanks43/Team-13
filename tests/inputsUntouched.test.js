import { describe, test, expect } from "@jest/globals";
import { init } from "../src/app.js";
import { createFakeDoc, actionClick, selectClick } from "./helpers/fakeDom.js";

// S2-06: Version A and Version B stay byte-for-byte unchanged by any merge edit.

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("input panes are never altered by merge actions", () => {
  test("random resolutions, selections and merged-pane edits leave A and B identical", () => {
    const rand = seeded(2026);
    const tricky = ["", "  indented", "tab\there", "unicode ✓ é", "<script>x</script>", "trailing space "];
    for (let round = 0; round < 50; round++) {
      const lines = () =>
        Array.from({ length: 1 + Math.floor(rand() * 8) }, () =>
          rand() < 0.5 ? tricky[Math.floor(rand() * tricky.length)] : `line ${Math.floor(rand() * 4)}`
        );
      const textA = lines().join(rand() < 0.5 ? "\n" : "\r\n") + (rand() < 0.5 ? "\n" : "");
      const textB = lines().join("\n");

      const doc = createFakeDoc();
      const { session } = init(doc);
      doc.elements["pane-a"].value = textA;
      doc.elements["pane-b"].value = textB;
      doc.elements["compare-btn"].dispatch("click");

      const list = doc.elements["conflict-list"];
      const count = session.getState().conflicts.length;
      for (let step = 0; step < 15; step++) {
        const roll = rand();
        if (count > 0 && roll < 0.5) {
          const id = 1 + Math.floor(rand() * count);
          list.dispatch("click", actionClick(["A", "B", "both"][Math.floor(rand() * 3)], id));
        } else if (count > 0 && roll < 0.7) {
          list.dispatch("click", selectClick(1 + Math.floor(rand() * count)));
        } else {
          doc.elements["merged-result"].value = `edit ${step} ${tricky[Math.floor(rand() * tricky.length)]}`;
          doc.elements["merged-result"].dispatch("input");
        }
        expect(doc.elements["pane-a"].value).toBe(textA);
        expect(doc.elements["pane-b"].value).toBe(textB);
      }
    }
  });
});

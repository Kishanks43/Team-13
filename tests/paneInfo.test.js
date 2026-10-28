import { describe, test, expect } from "@jest/globals";
import { describeLines } from "../src/ui/paneInfo.js";
import { diffText } from "../src/engine/diff.js";

describe("describeLines", () => {
  test("an empty pane has 0 lines", () => {
    expect(describeLines("")).toBe("0 lines");
  });

  test("one line is singular", () => {
    expect(describeLines("hello")).toBe("1 line");
  });

  test("counts lines in the text", () => {
    expect(describeLines("a\nb\nc")).toBe("3 lines");
  });

  test("a trailing newline does not add a line", () => {
    expect(describeLines("a\nb\n")).toBe("2 lines");
  });

  test("blank lines in the middle count", () => {
    expect(describeLines("a\n\n\nb")).toBe("4 lines");
  });

  test("Windows line endings count the same as Unix ones", () => {
    expect(describeLines("a\r\nb\r\nc")).toBe("3 lines");
  });

  test("agrees with the diff: comparing text with itself gives that many unchanged lines", () => {
    const text = "x\ny\n\nz\n";
    const lines = Number(describeLines(text).split(" ")[0]);
    expect(diffText(text, text)).toHaveLength(lines);
  });
});

/** Small helpers for the two input panes. */
import { splitLines } from "../engine/diff.js";

/** "0 lines", "1 line", "12 lines". Uses the same line rules as the diff, so the numbers always agree. */
export function describeLines(text) {
  const n = splitLines(text).length;
  return `${n} ${n === 1 ? "line" : "lines"}`;
}

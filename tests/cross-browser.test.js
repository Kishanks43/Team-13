import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/ui/app.css", import.meta.url), "utf8");
const diffStyles = readFileSync(new URL("../src/ui/diff.css", import.meta.url), "utf8");
const exportModule = readFileSync(new URL("../src/ui/exportMerged.js", import.meta.url), "utf8");

describe("S3-06 cross-browser baseline", () => {
  test("loads the app as a standards-based ES module and declares a responsive viewport", () => {
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1(?:\.0)?">/);
    expect(html).toMatch(/<script type="module" src="src\/app\.js"><\/script>/);
    expect(html).not.toMatch(/<script\s+[^>]*\bon[a-z]+\s*=/i);
  });

  test("uses native controls and standard responsive layout primitives", () => {
    expect(html).toContain('<textarea id="pane-a"');
    expect(html).toContain('<textarea id="pane-b"');
    expect(html).toContain('<textarea id="merged-result"');
    expect(styles).toMatch(/display:\s*grid/);
    expect(styles).toMatch(/display:\s*flex/);
    expect(styles).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
    expect(diffStyles).toContain("white-space: pre-wrap");
  });

  test("does not depend on legacy browser-specific event or layout APIs", () => {
    expect(app).not.toMatch(/attachEvent\s*\(/);
    expect(app).not.toMatch(/document\.all\b/);
    expect(styles + diffStyles).not.toMatch(/-ms-grid/);
  });

  test("feature-detects clipboard support and reports outcomes", () => {
    expect(exportModule).toMatch(/navigator\.clipboard/);
    expect(exportModule).toMatch(/catch\s*\(/);
    expect(exportModule).toMatch(/success|copied/i);
  });
});

import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";

describe("S3-06 browser compatibility safeguards", () => {
  test("page loads the app as a native ES module", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toContain('<script type="module" src="src/app.js"></script>');
  });

  test("clipboard support is feature-detected and has a fallback", () => {
    const source = readFileSync(new URL("../src/ui/exportMerged.js", import.meta.url), "utf8");
    expect(source).toContain('typeof nav.clipboard.writeText === "function"');
    expect(source).toContain('doc.execCommand("copy")');
  });

  test("download path uses Blob object URLs and revokes them", () => {
    const source = readFileSync(new URL("../src/ui/exportMerged.js", import.meta.url), "utf8");
    expect(source).toContain("createObjectURL");
    expect(source).toContain("revokeObjectURL");
  });
});

/**
 * @jest-environment jsdom
 */
import { describe, test, expect } from "@jest/globals";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { diffText } from "../src/engine/diff.js";
import { findConflicts } from "../src/engine/conflicts.js";
import { buildRows, renderSideBySide, escapeHtml } from "../src/ui/diffView.js";
import { renderConflictList } from "../src/ui/conflictList.js";
import { init } from "../src/app.js";
import { createFakeDoc } from "./helpers/fakeDom.js";

// S3-02: pasted code is shown as text and never runs.

const PAYLOADS = [
  "<script>window.__pwned = 1</script>",
  '<img src=x onerror="window.__pwned = 1">',
  "<svg onload=window.__pwned=1>",
  '"><script>window.__pwned = 1</script>',
  "'><iframe src=javascript:window.__pwned=1></iframe>",
  "</textarea><script>window.__pwned = 1</script>",
  "<a href=\"javascript:window.__pwned=1\">click</a>",
  "<style>body{display:none}</style>",
  "&lt;script&gt;already escaped&lt;/script&gt;",
  "<!-- comment --><details open ontoggle=window.__pwned=1>"
];

const SRC_DIR = fileURLToPath(new URL("../src/", import.meta.url));

function sourceFiles(dir = SRC_DIR) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith(".js") ? [path] : [];
  });
}

function assertInert(container) {
  expect(container.querySelector("script, iframe, img, svg, style, object, embed, a, details")).toBeNull();
  for (const element of container.querySelectorAll("*")) {
    for (const attribute of element.attributes) {
      expect(attribute.name.startsWith("on")).toBe(false);
      expect(String(attribute.value).toLowerCase()).not.toContain("javascript:");
    }
  }
}

describe("escapeHtml", () => {
  test("escapes the five characters that can open or close markup", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  test("escapes & first, so existing entities are shown literally", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("the side-by-side view shows pasted code as plain text", () => {
  test.each(PAYLOADS)("payload %#: no element, no handler, same text", (payload) => {
    const ops = diffText(`keep\n${payload}`, `keep\nother ${payload}`);
    const container = document.createElement("div");
    container.innerHTML = renderSideBySide(buildRows(ops));
    assertInert(container);
    expect(container.textContent).toContain(payload);
    expect(window.__pwned).toBeUndefined();
  });

  test("a payload on both sides and in unchanged lines is also inert", () => {
    const text = PAYLOADS.join("\n");
    const container = document.createElement("div");
    container.innerHTML = renderSideBySide(buildRows(diffText(text, text)));
    assertInert(container);
    for (const payload of PAYLOADS) expect(container.textContent).toContain(payload);
  });
});

describe("the conflict list never contains pasted text as markup", () => {
  test.each(PAYLOADS)("payload %#", (payload) => {
    const conflicts = findConflicts(diffText(payload, `${payload}\nmore`));
    const container = document.createElement("div");
    container.innerHTML = renderConflictList(conflicts, {}, null);
    assertInert(container);
  });

  test("a hostile status value is escaped, not injected", () => {
    const conflicts = findConflicts(diffText("a", "b"));
    const hostile = '"><script>window.__pwned = 1</script>';
    const html = renderConflictList(conflicts, { 1: hostile }, null);
    const container = document.createElement("div");
    container.innerHTML = html;
    assertInert(container);
    expect(html).not.toContain("<script>");
  });
});

describe("the page with hostile input in the panes", () => {
  test.each(PAYLOADS)("payload %#: Compare and Accept leave the page untouched", (payload) => {
    const doc = createFakeDoc();
    const app = init(doc, { setTimer: () => 1, clearTimer: () => {} });
    doc.elements["pane-a"].value = `top\n${payload}\nend`;
    doc.elements["pane-b"].value = `top\nB ${payload}\nend`;
    doc.elements["compare-btn"].dispatch("click");

    const list = document.createElement("div");
    list.innerHTML = doc.elements["conflict-list"].innerHTML;
    assertInert(list);

    app.session.resolve(1, "both");
    // The merged pane is a textarea, so its value is data and is kept byte for byte.
    expect(doc.elements["merged-result"].value).toBe(`top\n${payload}\nB ${payload}\nend`);
    expect(window.__pwned).toBeUndefined();
  });
});

describe("guards that stop unsafe rendering from creeping back in", () => {
  test("only the known innerHTML assignments exist in src", () => {
    const found = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/\.(innerHTML|outerHTML)\s*=[^=]|insertAdjacentHTML|document\.write|\beval\s*\(|new Function\s*\(/g)) {
        found.push(`${relative(SRC_DIR, file).split(sep).join("/")}: ${match[0].trim()}`);
      }
    }
    const allowed = ["app.js: .innerHTML ="];
    expect(found.filter((entry) => !allowed.includes(entry))).toEqual([]);
  });

  test("index.html has no inline script, no inline handler and a content security policy", () => {
    const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
    expect(html).toMatch(/http-equiv="Content-Security-Policy"/);
    expect(html).toMatch(/script-src 'self'/);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/javascript:/i);
  });
});

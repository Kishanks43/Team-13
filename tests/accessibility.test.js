import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/ui/app.css", import.meta.url), "utf8");
const conflictList = readFileSync(new URL("../src/ui/conflictList.js", import.meta.url), "utf8");

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function token(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Missing CSS token --${name}`);
  return match[1];
}

const light = css.match(/:root\s*\{([\s\S]*?)\}/)[1];
const dark = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/)[1];

describe("S3-05 keyboard access and contrast", () => {
  test("provides a skip link and a focusable main landmark", () => {
    expect(html).toMatch(/<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
    expect(html).toMatch(/<main[^>]*id="main-content"[^>]*tabindex="-1"/);
  });

  test("gives each code editor an accessible name and sections headings", () => {
    expect(html).toMatch(/id="pane-a"[^>]*aria-label="Version A code"/);
    expect(html).toMatch(/id="pane-b"[^>]*aria-label="Version B code"/);
    expect(html).toMatch(/id="merged-result"[^>]*aria-label="Editable merged result"/);
    expect(html).toContain('aria-labelledby="conflicts-heading"');
    expect(html).toContain('aria-labelledby="merged-heading"');
  });

  test("announces the conflict list and labels repeated resolution controls by conflict", () => {
    expect(html).toContain('aria-label="Conflict list and resolution controls"');
    expect(conflictList).toContain('aria-label="${text} for conflict ${conflict.id}"');
    expect(conflictList).toContain('aria-pressed="${status === action}"');
  });

  test("keeps keyboard focus visible on every interactive control", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--accent\)/);
    expect(css).toContain("outline-offset: 3px");
  });

  test("light theme text, status and primary button colors meet WCAG AA", () => {
    const panel = token(light, "panel");
    expect(contrast(token(light, "text"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(light, "muted"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(light, "open"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(light, "done"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(light, "accent-text"), token(light, "accent-solid"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(light, "border"), panel)).toBeGreaterThanOrEqual(3);
  });

  test("dark theme text, status and primary button colors meet WCAG AA", () => {
    const panel = token(dark, "panel");
    expect(contrast(token(dark, "text"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "muted"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "open"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "done"), panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "accent-text"), token(dark, "accent-solid"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "border"), panel)).toBeGreaterThanOrEqual(3);
    expect(contrast(token(dark, "accent"), panel)).toBeGreaterThanOrEqual(3);
  });
});

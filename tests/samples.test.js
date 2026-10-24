import { describe, test, expect } from "@jest/globals";
import { samples, getSample } from "../src/samples.js";
import { diffText, countChangeRegions } from "../src/engine/diff.js";

describe("sample scenarios", () => {
  test("there are three samples", () => {
    expect(samples).toHaveLength(3);
  });

  test("ids are unique and every sample has a name and description", () => {
    const ids = samples.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of samples) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  test.each(samples.map((s) => [s.name, s]))("%s: both versions are filled in and different", (_name, s) => {
    expect(s.a.trim().length).toBeGreaterThan(0);
    expect(s.b.trim().length).toBeGreaterThan(0);
    expect(s.a).not.toBe(s.b);
  });

  test.each(samples.map((s) => [s.name, s]))("%s: has the documented number of changed regions", (_name, s) => {
    expect(countChangeRegions(diffText(s.a, s.b))).toBe(s.expectedRegions);
  });

  test("getSample finds a sample by id", () => {
    expect(getSample("same-line-conflict")).toBe(samples[1]);
  });

  test("getSample returns undefined for an unknown id", () => {
    expect(getSample("nope")).toBeUndefined();
  });
});

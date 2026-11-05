import { describe, test, expect, jest } from "@jest/globals";
import { init } from "../src/app.js";
import {
  DOWNLOAD_NAME,
  EMPTY_MESSAGE,
  EMPTY_COPY_MESSAGE,
  MIME_TYPE,
  copyText,
  downloadText,
  makeBlob
} from "../src/ui/exportMerged.js";
import { createFakeDoc, actionClick } from "./helpers/fakeDom.js";

// S3-08: the downloaded file and the copied text match the final output exactly.

// Records what the download would contain instead of touching a real browser.
function fakeDownloadEnv() {
  const calls = { clicked: [], revoked: [], appended: 0, removed: 0, blobs: [] };
  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      calls.blobs.push(this);
    }
  }
  const doc = {
    body: { appendChild: () => (calls.appended += 1) },
    createElement: () => {
      const link = {
        click: () => calls.clicked.push({ href: link.href, download: link.download }),
        remove: () => (calls.removed += 1)
      };
      return link;
    }
  };
  const urlApi = {
    createObjectURL: (blob) => `blob:fake/${calls.blobs.indexOf(blob)}`,
    revokeObjectURL: (url) => calls.revoked.push(url)
  };
  const timers = [];
  return { calls, timers, deps: { doc, urlApi, BlobCtor: FakeBlob, setTimer: (fn) => timers.push(fn) } };
}

const TEXTS = [
  "plain\ntext",
  "",
  "trailing newline\n",
  "  leading spaces\n\ttabs\ttoo  ",
  "unicode ✓ é 😀 日本語",
  "<script>alert(1)</script> & \"quotes\"",
  "blank\n\n\nlines",
  "x".repeat(100000)
];

describe("makeBlob", () => {
  test("holds the text unchanged with a UTF-8 text type", () => {
    const blob = makeBlob("abc\n", class { constructor(parts, options) { this.parts = parts; this.options = options; } });
    expect(blob.parts).toEqual(["abc\n"]);
    expect(blob.options.type).toBe(MIME_TYPE);
    expect(MIME_TYPE).toContain("charset=utf-8");
  });
});

describe("downloadText", () => {
  test.each(TEXTS.filter((t) => t !== ""))("downloads exactly this text: %#", (text) => {
    const { calls, deps } = fakeDownloadEnv();
    const result = downloadText(text, deps);
    expect(result.ok).toBe(true);
    expect(calls.blobs).toHaveLength(1);
    expect(calls.blobs[0].parts).toEqual([text]);
    expect(calls.clicked).toEqual([{ href: "blob:fake/0", download: DOWNLOAD_NAME }]);
  });

  test("the link is added, clicked and removed, and the address is released later", () => {
    const { calls, timers, deps } = fakeDownloadEnv();
    downloadText("abc", deps);
    expect(calls.appended).toBe(1);
    expect(calls.removed).toBe(1);
    expect(calls.revoked).toEqual([]);
    timers[0]();
    expect(calls.revoked).toEqual(["blob:fake/0"]);
  });

  test("a custom file name is used", () => {
    const { calls, deps } = fakeDownloadEnv();
    downloadText("abc", { ...deps, filename: "result.js" });
    expect(calls.clicked[0].download).toBe("result.js");
  });

  test("an empty result is refused with a clear message and nothing is created", () => {
    const { calls, deps } = fakeDownloadEnv();
    expect(downloadText("", deps)).toEqual({ ok: false, message: EMPTY_MESSAGE });
    expect(calls.blobs).toHaveLength(0);
    expect(calls.clicked).toHaveLength(0);
  });

  test("a browser failure is reported instead of thrown", () => {
    const { deps } = fakeDownloadEnv();
    const broken = { ...deps, urlApi: { createObjectURL: () => { throw new Error("no"); }, revokeObjectURL: () => {} } };
    expect(downloadText("abc", broken)).toEqual({ ok: false, message: "The file could not be downloaded." });
  });
});

describe("copyText", () => {
  test.each(TEXTS.filter((t) => t !== ""))("copies exactly this text: %#", async (text) => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const result = await copyText(text, { nav: { clipboard: { writeText } } });
    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(text);
  });

  test("an empty result is refused", async () => {
    const writeText = jest.fn();
    expect(await copyText("", { nav: { clipboard: { writeText } } })).toEqual({ ok: false, message: EMPTY_COPY_MESSAGE });
    expect(writeText).not.toHaveBeenCalled();
  });

  test("falls back to a hidden textarea when the clipboard is missing or refuses", async () => {
    for (const nav of [undefined, {}, { clipboard: { writeText: () => Promise.reject(new Error("denied")) } }]) {
      const made = [];
      const doc = {
        body: { appendChild: () => {} },
        createElement: () => {
          const area = {
            style: {},
            setAttribute: () => {},
            select: () => {},
            remove: () => {}
          };
          made.push(area);
          return area;
        },
        execCommand: jest.fn().mockReturnValue(true)
      };
      const result = await copyText("copy me", { nav, doc });
      expect(result.ok).toBe(true);
      expect(made[0].value).toBe("copy me");
      expect(doc.execCommand).toHaveBeenCalledWith("copy");
    }
  });

  test("reports a blocked copy without throwing", async () => {
    const doc = {
      body: { appendChild: () => {} },
      createElement: () => ({ style: {}, setAttribute: () => {}, select: () => {}, remove: () => {} }),
      execCommand: () => false
    };
    const result = await copyText("x", { nav: {}, doc });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("blocked");
  });
});

describe("the page buttons", () => {
  function page() {
    const doc = createFakeDoc();
    for (const id of ["download-btn", "copy-btn", "export-note"]) {
      doc.elements[id] = { textContent: "", addEventListener: (t, fn) => ((doc.elements[id].fn ??= {})[t] = fn) };
    }
    const env = fakeDownloadEnv();
    const writeText = jest.fn().mockResolvedValue(undefined);
    init(doc, { setTimer: () => 1, clearTimer: () => {} }, { ...env.deps, nav: { clipboard: { writeText } } });
    doc.elements["pane-a"].value = "top\nA1\nend";
    doc.elements["pane-b"].value = "top\nB1\nend";
    doc.elements["compare-btn"].dispatch("click");
    return { doc, env, writeText };
  }

  test("Download gives a file that matches the merged pane, after any resolution", () => {
    const { doc, env } = page();
    doc.elements["conflict-list"].dispatch("click", actionClick("both", 1));
    doc.elements["download-btn"].fn.click();
    expect(env.calls.blobs.at(-1).parts).toEqual([doc.elements["merged-result"].value]);
    expect(env.calls.blobs.at(-1).parts[0]).toBe("top\nA1\nB1\nend");
    expect(doc.elements["export-note"].textContent).toBe(`Downloaded ${DOWNLOAD_NAME}.`);
  });

  test("Download gives the text as edited by hand", () => {
    const { doc, env } = page();
    doc.elements["conflict-list"].dispatch("click", actionClick("A", 1));
    doc.elements["merged-result"].value = "my own\ntext\n";
    doc.elements["merged-result"].dispatch("input");
    doc.elements["download-btn"].fn.click();
    expect(env.calls.blobs.at(-1).parts).toEqual(["my own\ntext\n"]);
  });

  test("Copy puts the same text on the clipboard", async () => {
    const { doc, writeText } = page();
    doc.elements["conflict-list"].dispatch("click", actionClick("B", 1));
    await doc.elements["copy-btn"].fn.click();
    expect(writeText).toHaveBeenCalledWith("top\nB1\nend");
    expect(doc.elements["export-note"].textContent).toBe("Copied the merged result.");
  });

  test("before anything is merged, both buttons say there is nothing yet", async () => {
    const doc = createFakeDoc();
    for (const id of ["download-btn", "copy-btn", "export-note"]) {
      doc.elements[id] = { textContent: "", addEventListener: (t, fn) => ((doc.elements[id].fn ??= {})[t] = fn) };
    }
    init(doc, { setTimer: () => 1, clearTimer: () => {} }, fakeDownloadEnv().deps);
    doc.elements["download-btn"].fn.click();
    expect(doc.elements["export-note"].textContent).toBe(EMPTY_MESSAGE);
    await doc.elements["copy-btn"].fn.click();
    expect(doc.elements["export-note"].textContent).toBe(EMPTY_COPY_MESSAGE);
  });
});

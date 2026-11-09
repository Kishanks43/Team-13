import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
export const readProjectFile = (path) => readFileSync(root + path, "utf8");

// Puts the real index.html into the jsdom document, so tests use the real element ids.
export function loadPage() {
  const source = readProjectFile("index.html");
  document.documentElement.innerHTML = source;
  // Setting innerHTML on <html> drops its own attributes, so copy lang from the source.
  const lang = source.match(/<html[^>]*\blang="([^"]+)"/);
  if (lang) document.documentElement.lang = lang[1];
}

export const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
export const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

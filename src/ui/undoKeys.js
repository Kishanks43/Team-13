const TEXT_INPUT_TYPES = new Set([
  "",
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
]);

export function isTextEntry(target) {
  if (!target) return false;
  const tag = target.tagName;

  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") {
    const type = typeof target.type === "string" ? target.type.toLowerCase() : "";
    return TEXT_INPUT_TYPES.has(type);
  }
  return target.isContentEditable === true;
}

export function undoRedoAction(event) {
  if (!event || !(event.ctrlKey || event.metaKey) || event.altKey) return null;
  if (isTextEntry(event.target)) return null;

  const key = typeof event.key === "string" ? event.key.toLowerCase() : "";

  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y") return "redo";
  return null;
}

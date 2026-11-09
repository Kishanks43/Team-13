export function formatLineCount(count) {
  return `${count} ${count === 1 ? "line" : "lines"}`;
}

// The text shown under a pane after a file load attempt.
export function formatLoadNote(result) {
  if (result.ok) return `Loaded ${result.name}.`;
  return `Could not load ${result.name || "file"}: ${result.error}`;
}

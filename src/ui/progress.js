// Builds the text for the live conflict counter.
export function formatProgress(progress) {
  if (!progress || !progress.total) return "No conflicts.";
  return `${progress.total} total · ${progress.resolved} resolved · ${progress.remaining} remaining`;
}

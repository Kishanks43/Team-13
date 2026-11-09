export function formatProgress(progress) {
  if (progress.total === 0) return "No conflicts";
  return `${progress.total} total · ${progress.resolved} resolved · ${progress.remaining} remaining`;
}

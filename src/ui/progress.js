export function formatProgress(progress) {
  return `${progress.total} total · ${progress.resolved} resolved · ${progress.remaining} remaining`;
}
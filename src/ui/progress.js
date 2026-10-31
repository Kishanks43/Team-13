/** Text for the conflict counter, e.g. "Conflicts: 3 total, 1 resolved, 2 remaining". */
export function formatProgress({ total, resolved, remaining }) {
  if (total === 0) return "No conflicts.";
  return `Conflicts: ${total} total, ${resolved} resolved, ${remaining} remaining`;
}

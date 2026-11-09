// The note under the merged pane. Open conflicts appear there with Git-style markers (S3-04).
export function describeMerge(progress) {
  if (progress.total === 0) return "No conflicts. The merged result is the same as both versions.";
  if (progress.remaining > 0) {
    const noun = progress.remaining === 1 ? "conflict is" : "conflicts are";
    return `${progress.remaining} open ${noun} shown with Git-style markers (<<<<<<<, =======, >>>>>>>). Resolve each one to remove its markers.`;
  }
  return "All conflicts resolved. You can still edit the merged result.";
}

import { hasConflictMarkers } from "./merge.js";

/**
 * Checks whether the merge can be safely applied.
 *
 * Roadmap S3-07:
 * "The Apply Merge button is disabled while any conflict is open or markers remain,
 * and explains why (for example, '2 conflicts left'). It enables as soon as the
 * last one is resolved."
 *
 * @param {Object} [options]
 * @param {boolean} [options.hasCompared=false] - whether a comparison has run
 * @param {Object} [options.progress={ total: 0, remaining: 0 }] - session progress
 * @param {string} [options.mergedText=""] - current text in the merged result pane
 * @returns {{ allowed: boolean, reason: string }}
 */
export function checkMergeGuard({
  hasCompared = false,
  progress = { total: 0, remaining: 0 },
  mergedText = ""
} = {}) {
  if (!hasCompared) {
    return {
      allowed: false,
      reason: "Compare versions to begin"
    };
  }

  const remaining = progress?.remaining ?? 0;
  if (remaining > 0) {
    return {
      allowed: false,
      reason: `${remaining} conflict${remaining === 1 ? "" : "s"} left`
    };
  }

  if (hasConflictMarkers(mergedText)) {
    return {
      allowed: false,
      reason: "Resolve conflict markers in merged result"
    };
  }

  return {
    allowed: true,
    reason: "Ready to apply merge"
  };
}

export function canApplyMerge(options) {
  return checkMergeGuard(options).allowed;
}

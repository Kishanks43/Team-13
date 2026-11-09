# S3-04 Fix: Git-style conflict markers

## Branch
`s3-04-Git-style-Conflict-Markers`

## Root cause of the failed CI run
The failed revision inserted `<<<<<<< A`, `=======` and `>>>>>>> B` directly into `linesForResolution()` in `src/engine/merge.js` for the `open` status. That pure engine output is also consumed by manual-edit segment tracking and performance tests. Consequently, marker rows shifted manual-edit ranges, appeared in outputs expected to contain only accepted lines, and inflated the 2,000-line merge result (the performance test received 6,000 lines instead of 1,000).

## Corrected design
- The pure merge engine emits accepted A/B/Both content only. Open and Manual states contribute no canonical lines.
- `src/engine/manualEdit.js` decorates the Merged Result presentation with Git markers for open conflicts and tracks their display-only ranges separately from canonical merge segments.
- When an open block is manually edited, its control marker rows are stripped from the saved Manual content. Other still-open conflicts keep their markers.
- Edit regions are analyzed independently, so a change in one conflict plus an unrelated footer edit does not accidentally mark a different conflict Manual.
- Resolving, selecting, undoing, redoing and re-comparing preserve the relevant marker/manual state.

## Files changed for this story
- `src/engine/merge.js`
- `src/engine/manualEdit.js`
- `src/app.js`
- `tests/merge.test.js`
- `tests/app.test.js`
- `tests/manualStatus.test.js`
- `tests/resolveFlow.test.js`
- `tests/s3-04-conflict-markers.test.js`
- `docs/S3-04-GIT-CONFLICT-MARKERS.md`

## Commands
```bash
npm ci
npm test
npm run lint
```

## Commit message
`S3-04: render Git conflict markers in the merged pane`

## Integration
This ZIP is a full snapshot of the supplied Team-13 repository with the S3-04 correction applied. Start from the latest `main` and copy the files listed above into the story branch; do not overwrite unrelated newer changes by replacing the entire repository snapshot.

## Follow-up correction: clear the entire merged pane
The follow-up CI run (job `129051936939`) isolated one remaining failure in `detectManualEdits`. When the user cleared the complete merged pane, the whole-pane shortcut reset every segment but returned no `edits`, so populated conflicts were not marked Manual. The shortcut now returns `{ id, lines: [] }` for every previously populated conflict segment, while leaving already-empty segments unchanged. It also retains marker metadata on reset segments so the display layer can rebuild correctly.

The regression test in `tests/manualEdit.test.js` now checks both conflict IDs, empty replacement line arrays, an empty new pane, and reset segment positions.

## Verification status
JavaScript syntax checks and direct Node regression checks passed, including marker display/removal, Manual resolution, unaffected input panes, and the 2,000-line pure-merge output contract. The full Jest suite was not run locally because installing the project's dependencies timed out. Run the commands above in the branch/CI before merging.

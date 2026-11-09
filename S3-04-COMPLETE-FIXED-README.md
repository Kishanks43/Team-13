# S3-04 — Complete fixed story package

This package contains the complete Team-13 repository snapshot used for the S3-04 Git-style Conflict Markers story, including the implementation, related tests, and documentation.

## Final CI regression-test correction

The resolution model stores only non-open statuses. An open conflict is represented by the absence of its ID in `resolutions`; `getStatus(resolutions, id)` converts that absence to `"open"`.

`tests/app.test.js` now uses `getStatus(...)` for the Manual and undo-to-Open assertions in the whole-merged-pane clear regression test. This fixes the test's incorrect direct lookup of `resolutions[1]`; production resolution behavior is unchanged.

## Files central to S3-04

- `src/engine/manualEdit.js`
- `src/engine/merge.js`
- `src/app.js`
- `tests/s3-04-conflict-markers.test.js`
- `tests/manualEdit.test.js`
- `tests/manualStatus.test.js`
- `tests/resolveFlow.test.js`
- `tests/app.test.js`
- `docs/S3-04-GIT-CONFLICT-MARKERS.md`
- `S3-04-FIX-README.md`

## Verify locally

```bash
npm ci
npm test
npm run lint
```

This is a complete repository snapshot, not a patch file. Copy only the S3-04-related files into a newer branch if other stories have advanced since this snapshot.

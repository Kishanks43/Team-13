# S3-04 Git-style conflict markers

## Implementation
- Unresolved conflicts are decorated in the Merged Result pane with the standard Git markers:
  - `<<<<<<< A`
  - `=======`
  - `>>>>>>> B`
- Accept A, Accept B, Accept Both and Manual remove the marker block for that conflict immediately.
- Marker lines and source-side lines are display scaffolding while a conflict is Open. They are not added to the pure merge engine's output or performance path.
- Manual edits inside a marked block are captured as the conflict's Manual output. Marker-control lines are never stored as part of that output.
- Changes in separate regions (for example, a conflict plus an unrelated footer edit) are detected independently so they do not resolve intervening conflicts accidentally.

## Tests
`tests/s3-04-conflict-markers.test.js` checks the marker format, removal after resolution and unchanged pure-engine contract. `tests/app.test.js`, `tests/manualStatus.test.js`, `tests/manualEdit.test.js`, and `tests/resolveFlow.test.js` cover UI behavior, manual edits and undo/redo.

Run:

```bash
npm test
npm run lint
```

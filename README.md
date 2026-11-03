# S3-04-Git-Style-Conflict-Markers

Show unresolved conflicts in the merged text with Git-style markers so they are easy to recognise
(roadmap story S3-04, issue #24). Done when open conflicts show the standard markers
(`<<<<<<<`, `=======`, `>>>>>>>`).

## What it does
An open conflict appears in the Merged Result like this:

```
<<<<<<< A
(A lines)
=======
(B lines)
>>>>>>> B
```

- The markers are removed as soon as that conflict is resolved (Accept A, B or Both). Other conflicts keep theirs.
- A conflict that is only an addition or only a deletion keeps the block, with an empty A or B side, as Git does.
- A conflict marked `manual` adds nothing to the built text, because its hand-written text lives in the editable pane.
- `buildMergedText(ops, conflicts, resolutions, { markers: false })` gives the old behaviour (open conflicts add nothing).
- `countConflictMarkers(text)` and `hasConflictMarkers(text)` find markers left in a text. S3-07 (Apply Merge guard)
  should use `hasConflictMarkers`, so a half-deleted block still counts as unresolved. A lone `=======` line is ignored,
  because it is a normal line in many files (for example a Markdown heading underline).
- The note under the merged pane explains the markers and shows how many conflicts are still open.

## Contents
- `src/engine/merge.js` — the marker logic (`CONFLICT_MARKERS`, `markerLines`, `countConflictMarkers`, `hasConflictMarkers`).
- `src/app.js` — page wiring; only the note under the merged pane is new.
- `tests/conflictMarkers.test.js` — the S3-04 tests, including random (property-style) ones.
- `tests/merge.test.js`, `tests/app.test.js` — updated, because open conflicts no longer add nothing.
- `src/`, `tests/` — the rest of the project, so the whole suite stays green in CI.
- `package.json` and `eslint.config.js` — project scripts and tooling.
- `index.html` — the page, so you can try the story by hand.

## Run
From this story folder:

```bash
npm install
npm test
npm run lint
```

To try the page by hand:

```bash
npm start
```

Then open `http://localhost:8080`, paste two versions that differ, and press Compare.

This folder is self-contained; it does not depend on files outside this story folder.

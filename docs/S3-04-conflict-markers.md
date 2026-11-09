# S3-04 Git-style conflict markers

Open conflicts appear in the merged text as `<<<<<<< A`, the A lines, `=======`, the B lines,
`>>>>>>> B`. Resolving a conflict removes its markers. Without this story, open conflicts
contribute no lines to the merged text.

`hasConflictMarkers()` and `countConflictMarkers()` in `src/engine/markers.js` let S3-07
treat leftover markers as unresolved. A lone `=======` (a Markdown underline) is not counted.

Files this story owns: `src/engine/markers.js`, `src/engine/merge.js` (open conflicts),
`src/ui/mergeNote.js`, the import and one line in `render` in `src/app.js`, and
`tests/markers.test.js`, `tests/merge.markers.test.js`, `tests/app.markers.test.js`.

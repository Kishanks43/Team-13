# Included roadmap scope

Source: `ROADMAP.md`.

## Sprint 1: S1-05 Reject bad uploads

- S1-05 (#5): Reject bad uploads. As a user, I want bad uploads rejected with a clear message so nothing breaks. Done when binary files and files over 2 MB are refused.
- S2-11 (new issue): Fix S1-05 upload checks (bug fix). Done when binary files and files over 2 MB are refused, and the upload tests run in CI.

Contract (from section 4): `loadFile(file)` resolves to `{ ok: true, name, text }` or `{ ok: false, name, error }` and never throws. It refuses binary files and files over 2 MB (`MAX_FILE_BYTES`).

Shows the error in the page through the existing `note-a` and `note-b` elements (`textContent`, never `innerHTML`).

## Sprint 2: S2-06 Tests for untouched input panes

- S2-06 (#16): Tests for untouched input panes. As a developer, I want tests proving the input panes are never altered by merge edits. Done when the tests pass in CI.
- Roadmap note for S2-06: property-style tests are welcome. Apply many random resolutions and edits, then assert that Version A and Version B text are byte-for-byte unchanged.

Depends on S2-04 (Accept A, B and Both) and S2-05 (editable Merged Result pane), whose code is included here so the tests have something to run against.
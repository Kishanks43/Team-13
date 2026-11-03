# Included roadmap scope

Source: `ROADMAP.md`, Sprint 2 section.

- S2-06 (#16): Tests for untouched input panes. As a developer, I want tests proving the input panes are never altered by merge edits. Done when the tests pass in CI.
- Roadmap note for S2-06: property-style tests are welcome. Apply many random resolutions and edits, then assert that Version A and Version B text are byte-for-byte unchanged.

Depends on S2-04 (Accept A, B and Both) and S2-05 (editable Merged Result pane), whose code is included here so the tests have something to run against.

The roadmap's shared contracts are represented in this package by `src/engine/conflicts.js`, `src/engine/resolutions.js`, and `src/engine/session.js`.

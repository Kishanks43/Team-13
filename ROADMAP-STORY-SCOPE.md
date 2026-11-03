# Included roadmap scope

Source: `ROADMAP.md`, Sprint 2 section.

- S2-04 (#14): Accept A, B and Both buttons. The buttons call the shared session resolution state with `A`, `B`, or `both`. Accept Both contributes A lines then B lines.
- S2-05 (#15): Editable Merged Result pane. Editing this pane must not write back into `pane-a` or `pane-b`.
- S2-06 (#16): Tests prove the two input panes remain byte-for-byte unchanged after merge edits.

The roadmap's shared contracts are represented in this package by `src/engine/conflicts.js`, `src/engine/resolutions.js`, and `src/engine/session.js`.

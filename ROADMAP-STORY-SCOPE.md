# Included roadmap scope

Source: `ROADMAP.md`, Sprint 1 section.

- S1-05 (#5): Reject bad uploads. As a user, I want bad uploads rejected with a clear message so nothing breaks. Done when binary files and files over 2 MB are refused.
- S2-11 (new issue): Fix S1-05 upload checks (bug fix). Done when binary files and files over 2 MB are refused, and the upload tests run in CI.

Contract (from section 4): `loadFile(file)` resolves to `{ ok: true, name, text }` or `{ ok: false, name, error }` and never throws. It refuses binary files and files over 2 MB (`MAX_FILE_BYTES`).

Shows the error in the page through the existing `note-a` and `note-b` elements (`textContent`, never `innerHTML`).

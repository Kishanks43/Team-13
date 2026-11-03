# Code Merge Simulator: story notes

Run these from the repository root:

```bash
npm install
npm test
npm run lint
npm start
```

Then open `http://localhost:8080` for the main page, or `http://localhost:8080/upload-demo.html` to try the upload checks.

## S1-05: Reject bad uploads

Reject bad uploads with a clear message so nothing breaks (roadmap story S1-05, issue #5).
Binary files and files over 2 MB are refused. This also covers the S2-11 bug fix, which restores
these checks in `src/fileLoader.js`.

`loadFile(file)` resolves to `{ ok: true, name, text }` or `{ ok: false, name, error }` and never throws.
It refuses:
- files over 2 MB (`MAX_FILE_BYTES`). The size is checked before reading, and again on the bytes
  actually read, because a reported size can be wrong.
- binary files: known signatures (PDF, PNG, JPEG, GIF, ZIP, gzip, executables), any NUL byte, or
  many control characters at the start of the file.
- UTF-16 text and text that is not valid UTF-8, each with its own message.

Text files load exactly as written (line endings, tabs, unicode). A 500-line file loads in well under 1 second.

Files:
- `src/fileLoader.js` — the loader and its checks.
- `tests/fileLoader.test.js` — 38 tests, including random (property-style) ones.
- `upload-demo.html` — a small page to try the checks by hand.

## S2-06: Tests for untouched input panes

Tests proving that Version A and Version B stay byte-for-byte unchanged by any merge edit
(roadmap story S2-06, issue #16).

What the tests prove:
- Resolving conflicts (Accept A, B, Both), selecting conflicts, editing the merged pane by hand,
  and re-comparing never change `pane-a` or `pane-b`.
- The app never even writes to the input panes (write counters stay at zero).
- Exact bytes are kept for tricky text: CRLF and lone CR, trailing newlines, tabs, a byte order mark,
  unicode, 5,000-character lines, empty and identical inputs.
- A seeded random (property-style) test runs 150 sessions of 25 random actions each.
- The engine never changes its inputs: diffing, conflict finding, merging and the session are run on
  deep-frozen data, so any in-place change would throw.

Files:
- `tests/inputsUntouched.test.js` — the S2-06 tests.
- `tests/helpers/` — `fakeDom.js` (a small stand-in for the page) and `seeded.js` (repeatable random numbers).
- `index.html` — the page, so you can try the story by hand.

## Tooling

`package.json` and `eslint.config.js` hold the project scripts and tooling. CI runs `npm ci`, `npm test` and `npm run lint` on Node 22.
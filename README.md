# S2-06-Tests-Untouched-Input-Panes

Tests proving that Version A and Version B stay byte-for-byte unchanged by any merge edit
(roadmap story S2-06, issue #16).

## What the tests prove
- Resolving conflicts (Accept A, B, Both), selecting conflicts, editing the merged pane by hand,
  and re-comparing never change `pane-a` or `pane-b`.
- The app never even writes to the input panes (write counters stay at zero).
- Exact bytes are kept for tricky text: CRLF and lone CR, trailing newlines, tabs, a byte order mark,
  unicode, 5,000-character lines, empty and identical inputs.
- A seeded random (property-style) test runs 150 sessions of 25 random actions each.
- The engine never changes its inputs: diffing, conflict finding, merging and the session are run on
  deep-frozen data, so any in-place change would throw.

## Contents
- `tests/inputsUntouched.test.js` — the S2-06 tests.
- `tests/helpers/` — `fakeDom.js` (a small stand-in for the page) and `seeded.js` (repeatable random numbers).
- `src/` — source modules the tests exercise, including shared engine/UI dependencies.
- `tests/` — also holds the earlier stories' tests so the whole suite stays green in CI.
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

Then open `http://localhost:8080`.

This folder is self-contained; it does not depend on files outside this story folder.

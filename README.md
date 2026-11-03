# S1-05-Reject-Bad-Uploads

Reject bad uploads with a clear message so nothing breaks (roadmap story S1-05, issue #5).
Binary files and files over 2 MB are refused. This also covers the S2-11 bug fix, which restores
these checks in `src/fileLoader.js`.

## What it does
`loadFile(file)` resolves to `{ ok: true, name, text }` or `{ ok: false, name, error }` and never throws.
It refuses:
- files over 2 MB (`MAX_FILE_BYTES`). The size is checked before reading, and again on the bytes
  actually read, because a reported size can be wrong.
- binary files: known signatures (PDF, PNG, JPEG, GIF, ZIP, gzip, executables), any NUL byte, or
  many control characters at the start of the file.
- UTF-16 text and text that is not valid UTF-8, each with its own message.

Text files load exactly as written (line endings, tabs, unicode). A 500-line file loads in well under 1 second.

## Contents
- `src/fileLoader.js` — the loader and its checks.
- `tests/fileLoader.test.js` — 38 tests, including random (property-style) ones.
- `upload-demo.html` — a small page to try the checks by hand.
- `package.json` and `eslint.config.js` — project scripts and tooling.

## Run
From this story folder:

```bash
npm install
npm test
npm run lint
```

To try it by hand:

```bash
npm start
```

Then open `http://localhost:8080/upload-demo.html` and choose a text file, an image and a file over 2 MB.

This folder is self-contained; it does not depend on files outside this story folder.

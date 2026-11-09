# Code Merge Simulator

A browser tool for comparing two versions of code, resolving every conflict, and building a
merged result. Plain HTML, CSS and JavaScript (ES modules). No build step.

## Run it

```
npm ci
npm start        # http://localhost:8080
npm run lint
npm test
```

Needs Node 22 or newer. The only dependencies are dev tools.

## Layout

```
index.html            page markup
src/app.js            wires the page to the engine
src/samples.js        three built-in scenarios
src/fileLoader.js     safe file reading (2 MB limit, binary check)
src/engine/           diff, conflicts, resolutions, session (undo/redo), merge
src/ui/               HTML builders for the diff and conflict list, CSS
tests/                Jest tests (engine in Node, page tests in jsdom)
docs/                 one notes file per Sprint 3 story that is present in this tree
```

## Notes for the team

* The merged text is joined with `\n` and has no trailing newline, so identical inputs
  merge to identical text.
* A conflict marked `manual` takes its text from `buildMergedText(..., manualLines)` when
  given; that wiring belongs to the manual-edit story.
* Typing in the merged pane never changes the resolutions; the next resolution or re-compare
  rebuilds the text (decision S2-05).
* The README is the same in every Sprint 3 story branch on purpose, so branches do not
  conflict on it. Story notes live in `docs/S3-0x-*.md`.

# Web-Based Code Merge Simulator (Team 13)

A browser tool that shows two versions of code side by side, highlights the differences, and lets you resolve each conflict by hand before producing one merged file.

## Tech
JavaScript (ES modules), HTML/CSS, Jest for tests, ESLint for linting, GitHub Actions for CI.

## Getting started
1. Clone the repo and run `npm install`
2. `npm start` to serve the app, then open the address it prints
3. `npm test` to run the tests
4. `npm run lint` to check the code style

## Project layout
```
src/engine/   diff and merge logic (no browser code)
src/ui/       rendering helpers
src/samples.js  built-in sample scenarios
tests/        Jest tests
docs/         SRS and SAD
```

## Team rules
- One branch per story, named like `s1-04-file-loading`
- Commit messages start with the story number, e.g. `S1-04: add file loading`
- Every pull request needs one review and a green CI check
- Write `Closes #<issue number>` in each pull request description

## Docs
- [SRS](docs/SRS_Team13.docx)
- [SAD](docs/SAD_Team13_arch.docx)

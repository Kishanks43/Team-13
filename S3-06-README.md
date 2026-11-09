# S3-06: Cross-browser support

## Branch
`s3-06-cross-browser-support`

## Scope
Adds automated checks for standards-based module loading, guarded clipboard/fallback behavior, and Blob download behavior, plus a four-browser manual test matrix.

## Story-specific files
- `docs/S3-06-CROSS-BROWSER-TESTING.md`
- `tests/s3-06-browser-compatibility.test.js`

## Run locally
1. Use Node.js 22.
2. Run `npm install`.
3. Run `npm run lint`.
4. Run `npm test`.
5. Run `npm start` and open the local URL printed by the server.

## Commit message
`S3-06: cross-browser support`

## Integration notes
This is a full snapshot of the supplied repository with **only this story's changes** applied. Create the branch from the latest `main`, copy the listed files into that branch, then run lint and tests. Do not merge this snapshot wholesale over a newer `main`.

Actual Chrome, Firefox, Edge and Safari runs must be completed and recorded; the package deliberately does not claim unperformed browser tests.

# S3-04: Git-style conflict markers

## Branch
`s3-04-git-conflict-markers`

## Scope
Unresolved conflicts in the Merged Result now render as `<<<<<<< A`, `=======`, and `>>>>>>> B`. Resolving a conflict replaces its marker block with the selected A/B/Both/manual content.

## Story-specific files
- `src/engine/merge.js`
- `tests/merge.test.js`

## Run locally
1. Use Node.js 22.
2. Run `npm install`.
3. Run `npm run lint`.
4. Run `npm test`.
5. Run `npm start` and open the local URL printed by the server.

## Commit message
`S3-04: git-style conflict markers`

## Integration notes
This is a full snapshot of the supplied repository with **only this story's changes** applied. Create the branch from the latest `main`, copy the listed files into that branch, then run lint and tests. Do not merge this snapshot wholesale over a newer `main`.

S3-07 relies on this same marker detection contract. Check the merged pane for markers before applying a merge.

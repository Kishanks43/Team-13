# S3-05: Keyboard access and contrast

## Branch
`s3-05-keyboard-accessibility`

## Scope
Adds a skip link, visible focus styling, improved muted and disabled-control contrast in light/dark themes, and an audit checklist.

## Story-specific files
- `index.html`
- `src/ui/app.css`
- `docs/S3-05-ACCESSIBILITY-CHECKLIST.md`

## Run locally
1. Use Node.js 22.
2. Run `npm install`.
3. Run `npm run lint`.
4. Run `npm test`.
5. Run `npm start` and open the local URL printed by the server.

## Commit message
`S3-05: keyboard access and contrast`

## Integration notes
This is a full snapshot of the supplied repository with **only this story's changes** applied. Create the branch from the latest `main`, copy the listed files into that branch, then run lint and tests. Do not merge this snapshot wholesale over a newer `main`.

Complete the actual axe/Lighthouse audit in a browser before marking issue #25 Done.

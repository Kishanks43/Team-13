# S3-05 Complete Story Bundle

This ZIP is a full repository snapshot based on the supplied `Team-13` main snapshot, with the S3-05 keyboard-accessibility and contrast changes applied. It also retains the S3-04 Git conflict marker implementation and adds an explicit export-contract regression test.

## Story

- **S3-05 — Keyboard access and contrast**
- GitHub issue: #25
- Acceptance target: keyboard-operable controls, visible focus, accessible names, WCAG AA contrast for key text/status/control colors in light and dark themes.

## Files added or updated for S3-05

- `index.html`
- `src/ui/app.css`
- `src/ui/conflictList.js`
- `tests/accessibility.test.js`
- `tests/s3-04-conflict-markers.test.js`
- `docs/S3-05-ACCESSIBILITY.md`

## S3-04 export failure

`src/engine/manualEdit.js` in this snapshot exports `buildMergedWithMarkers`. The S3-04 test imports and calls it, and now also contains an explicit export-contract assertion. This addresses the reported import/export mismatch in the included source snapshot.

## Run

```bash
npm ci
npm test
npm run lint
npm start
```

Open `http://localhost:8080`.

**Audit note:** automated Jest checks cover semantics and key color contrast pairs. A final real-browser axe/Lighthouse audit and keyboard-only pass are still required before claiming a zero-failure accessibility audit.

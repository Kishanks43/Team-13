# S3-05 — Keyboard access and contrast

## Changes

- Added a keyboard-first skip link to jump directly to the main application content.
- Kept native buttons and textareas as the interaction primitives, so Tab, Shift+Tab, Enter and Space work without custom keyboard emulation.
- Added a consistent, high-visibility `:focus-visible` outline to interactive controls.
- Added accessible names to repeated Accept A / Accept B / Accept Both controls (the conflict number is included in each name).
- Added explicit section labels and a labelled conflict-list region; existing live regions continue to announce status and export feedback.
- Increased control-border contrast and adjusted muted, status, focus and primary-action colors in both light and dark themes.
- Added reduced-motion handling.
- Added automated Jest checks for landmarks, labels, repeated action names, focus styles and WCAG contrast ratios for key text/status/control colors.

## S3-04 CI regression

The current `main` source already exports `buildMergedWithMarkers` from `src/engine/manualEdit.js`. The S3-04 test imports and exercises that public function. An explicit export-contract test has been added so a future refactor that removes or renames the export fails clearly. If CI is still running an older branch revision, merge/rebase the current implementation before rerunning the job.

## Validation

Run from the repository root:

```bash
npm ci
npm test
npm run lint
```

The Jest accessibility checks validate the source-level semantics and the key color pairs. Before release, also run Lighthouse or axe in both light and dark color schemes, and complete a keyboard-only pass (Tab / Shift+Tab / Enter / Space / Escape where applicable) in a real browser. Automated source checks do not replace a full browser accessibility audit.

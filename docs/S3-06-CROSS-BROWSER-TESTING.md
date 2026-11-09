# S3-06 Cross-browser test matrix

## Required browsers
- Current stable Google Chrome
- Current stable Mozilla Firefox
- Current stable Microsoft Edge
- Current stable Apple Safari

## Test procedure for each browser
1. Serve the static app using `npm start`.
2. Load each of the three sample scenarios and compare.
3. Resolve conflicts using Accept A, Accept B, Accept Both and manual editing.
4. Confirm open conflicts show Git-style markers and resolved conflicts do not.
5. Confirm Apply Merge is blocked until all conflicts and markers are gone.
6. Download and copy the result; compare it with the merged pane.
7. Check keyboard operation, light/dark theme, responsive layout and console errors.

| Browser | Version / OS | Functional flow | Download | Clipboard | Accessibility | Result |
|---|---|---|---|---|---|---|
| Chrome | To be recorded | Pending | Pending | Pending | Pending | Pending |
| Firefox | To be recorded | Pending | Pending | Pending | Pending | Pending |
| Edge | To be recorded | Pending | Pending | Pending | Pending | Pending |
| Safari | To be recorded | Pending | Pending | Pending | Pending | Pending |

## Automated compatibility safeguards
Jest checks that the page uses native ES modules, clipboard access is feature-detected with a fallback, and downloads use Blob/object URL APIs.

A Node/Jest pass is not evidence that the four real browsers passed. Record real browser/version results before closing issue #26.

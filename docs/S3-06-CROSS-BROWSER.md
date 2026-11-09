# S3-06 — Cross-browser support

## Compatibility choices

The app remains a static HTML/CSS/JavaScript ES-module application and avoids framework/build-step dependencies. Its UI uses standard DOM APIs (`querySelector`/`getElementById`, event listeners, `textContent`, `classList`, form controls), CSS Grid/Flexbox, media queries, and standard link/download behavior. User-entered source remains text in textareas; no browser-specific rendering APIs are required.

The export helper uses the Blob/object-URL download path where available and the Clipboard API when available, with a fallback path for browsers/contexts without `navigator.clipboard`. Clipboard access can be restricted to secure contexts (HTTPS or localhost) and by browser permission settings; a failure is reported in the UI rather than treated as success.

## Browser verification matrix

| Browser | Engine | Required verification | Result |
|---|---|---|---|
| Chrome (current) | Chromium | Load app, compare samples, resolve A/B/Both, edit merged pane, undo/redo, apply and export | Manual run required |
| Edge (current) | Chromium | Same workflow; verify download and clipboard permission behavior | Manual run required |
| Firefox (current) | Gecko | Same workflow; verify CSS layout/focus and export fallback | Manual run required |
| Safari (current) | WebKit | Same workflow; verify module loading, textarea editing, object-URL download and clipboard permission behavior | Manual run required |

This repository does not include four browser installations or a remote browser farm in its CI environment. Do not mark the matrix as passed until a human has run the workflow on each browser. CI unit tests validate the shared DOM-independent behavior and static browser-compatibility constraints, but are not a substitute for the four real-browser runs.

## Cross-browser regression coverage

`tests/cross-browser.test.js` checks that the page uses a module script, viewport metadata, native controls, no inline event-handler attributes, no browser-specific vendor-only layout dependencies in the main stylesheet, and safe feature detection for optional clipboard functionality. The tests deliberately avoid claiming that source inspection proves runtime compatibility.

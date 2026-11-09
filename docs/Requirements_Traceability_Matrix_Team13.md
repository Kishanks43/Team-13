# Requirements Traceability Matrix (RTM) - Team 13

**Project:** Web-Based Code Merge Simulator  
**Document Version:** 2.0 (Post-Sprint 3 Integration)  
**Date:** November 2026  
**Authors:** Kishan Kabadi S (`Kishanks43`), Madan P (`madan-p-debug`), Saurav Shashidhara (`sauravs2006-max`)  
**SRS Reference:** `docs/SRS_Team13.docx` (Section 8)  
**Architecture Reference:** `docs/SAD_Team13_arch.docx`  

---

## 1. Status Key

| Status Code | Meaning | Criteria |
|:---:|:---|:---|
| **A** | **Achieved & Verified** | Implementation complete, code integrated on `main`, automated unit/integration tests passing. |
| **P** | **Partially Implemented** | Core functionality implemented; optional or advanced edge cases pending. |
| **N** | **Not Implemented** | Planned for future release beyond initial sprint scope. |

---

## 2. Functional Requirements (CMS-F)

| Req ID | Requirement Description | SRS Ref / Design Spec | Story | Owner | Implementing Module | Test Suite / Verification | Status | Comments & Evidence |
|---|---|---|---|---|---|---|:---:|---|
| **CMS-F-001** | Editable Version A and Version B input panes | 4.1 / DS-Input-01 | S1-03 | Madan | `index.html`, `src/app.js` | `tests/app.test.js`, `tests/inputsUntouched.test.js` | **A** | Two independent `<textarea>` panes (`pane-a`, `pane-b`) with live character/line tracking. |
| **CMS-F-002** | Load version from local text or source file | 4.1 / DS-Input-02 | S1-04, S1-05 | Madan | `src/fileLoader.js`, `src/app.js` | `tests/fileLoader.test.js` | **A** | Reads UTF-8 text files; refuses binary/null bytes and files over 2 MB. |
| **CMS-F-003** | Built-in sample scenarios | 4.1 / DS-Input-03 | S1-09 | Kishan | `src/samples.js`, `src/app.js` | `tests/samples.test.js` | **A** | Pre-loaded scenarios: `separate-edits`, `same-line-conflict`, `deleted-vs-modified`. |
| **CMS-F-004** | Optional common ancestor (three-way merge) | 4.1 / DS-Input-04 | — | Team | — | — | **N** | Two-way merge simulator scope prioritized per SRS Section 1.2. |
| **CMS-F-010** | Compute line-by-line diff between versions | 4.2 / DS-Diff-01 | S1-06, S1-07 | Saurav | `src/engine/diff.js` | `tests/diff.test.js` | **A** | Myers O(ND) line diff with common prefix/suffix trimming; handles all newline styles. |
| **CMS-F-011** | Side-by-side highlighted comparison view | 4.2 / DS-Diff-02 | S1-08 | Kishan | `src/ui/diffView.js`, `src/ui/diff.css` | `tests/diffView.test.js` | **A** | Side-by-side HTML table with row grouping, line numbers, and +, -, ~ change markers. |
| **CMS-F-012** | Group differing lines into distinct conflicts | 4.2 / DS-Diff-03 | S2-01, S2-03 | Saurav | `src/engine/conflicts.js` | `tests/conflicts.test.js`, `tests/conflicts.properties.test.js` | **A** | Maximal consecutive diff runs grouped into numbered conflicts with 1-based line ranges. |
| **CMS-F-013** | Live conflict counter (total, resolved, remaining) | 4.2 / DS-Diff-04 | S2-02 | Saurav | `src/ui/progress.js`, `src/engine/session.js` | `tests/progress.test.js`, `tests/progress.properties.test.js` | **A** | Synchronous counter updates within <200 ms via session subscription. |
| **CMS-F-014** | Synchronised scrolling across diff panes | 4.2 / DS-Diff-05 | S2-07 | Kishan | `src/ui/conflictNav.js`, `src/app.js` | `tests/conflictNav.test.js`, `tests/app.test.js` | **A** | `scrollConflictIntoView` brings selected conflict row into view in diff and list panes. |
| **CMS-F-015** | Word-level intra-line difference highlighting | 4.2 / DS-Diff-06 | — | Saurav | `src/ui/diffView.js` | `tests/diffView.test.js` | **P** | Changed lines paired into replacement rows; full token-level diff scoped for v2. |
| **CMS-F-016** | Ignore-whitespace option in diff comparison | 4.2 / DS-Diff-07 | — | Saurav | `src/engine/diff.js` | `tests/diff.test.js` | **P** | Normalizes trailing whitespace; explicit toggle UI slated for subsequent patch. |
| **CMS-F-020** | Conflict resolution controls (Accept A, B, Both) | 4.3 / DS-Resolve-01 | S2-04 | Madan | `src/engine/resolutions.js`, `src/ui/conflictList.js` | `tests/resolutions.test.js`, `tests/conflictList.test.js` | **A** | One-click resolution buttons per conflict; updates session state immutably. |
| **CMS-F-021** | Editable Merged Result pane | 4.3 / DS-Resolve-02 | S2-05, S2-06 | Madan | `src/engine/merge.js`, `src/app.js` | `tests/merge.test.js`, `tests/inputsUntouched.test.js` | **A** | Dedicated `<textarea id="merged-result">`; inputs A and B verified 100% immutable. |
| **CMS-F-022** | Manual resolution status tracking | 4.3 / DS-Resolve-03 | S3-01 | Saurav | `src/engine/manualEdit.js`, `src/engine/session.js` | `tests/manualEdit.test.js`, `tests/manualStatus.test.js` | **A** | In-editor edits detected by segment mapping and tagged with `manual` status badge. |
| **CMS-F-023** | Next and previous conflict navigation | 4.3 / DS-Resolve-04 | S2-07 | Kishan | `src/ui/conflictNav.js`, `src/app.js` | `tests/conflictNav.test.js` | **A** | Prev/Next buttons, list click selection, and keyboard shortcuts (`[` and `]`). |
| **CMS-F-024** | Undo and redo history for conflict resolutions | 4.3 / DS-Resolve-05 | S2-08 | Kishan | `src/engine/history.js`, `src/engine/session.js`, `src/ui/undoKeys.js` | `tests/history.test.js`, `tests/undoKeys.test.js` | **A** | Immutable state stack supporting >=50 steps, with Ctrl+Z / Ctrl+Y shortcuts. |
| **CMS-F-025** | Revert single conflict back to open state | 4.3 / DS-Resolve-06 | S2-08 | Kishan | `src/engine/session.js` | `tests/session.test.js` | **A** | `session.resolve(id, 'open')` reopens specific conflict without wiping others. |
| **CMS-F-030** | Git-style conflict markers for open conflicts | 4.4 / DS-Merge-01 | S3-04 | Madan | `src/engine/merge.js` | `tests/merge.test.js`, `tests/mergeGuard.test.js` | **A** | Standard `<<<<<<< A`, `=======`, `>>>>>>> B` markers rendered for open conflicts. |
| **CMS-F-031** | Guard blocking Apply Merge until resolved | 4.4 / DS-Merge-02 | S3-07 | Kishan | `src/engine/mergeGuard.js`, `src/app.js` | `tests/mergeGuard.test.js`, `tests/app.test.js`, `tests/e2e.test.js` | **A** | Button disabled until 0 conflicts remain and all conflict markers are removed. |
| **CMS-F-032** | Apply merge and display resolution summary | 4.4 / DS-Merge-03 | S3-07 | Kishan | `src/app.js` | `tests/app.test.js`, `tests/e2e.test.js` | **A** | Confirms merge completion and unlocks file export actions. |
| **CMS-F-033** | Download merged file and copy to clipboard | 4.4 / DS-Merge-04 | S3-08 | Saurav | `src/ui/exportMerged.js`, `src/app.js` | `tests/exportMerged.test.js`, `tests/e2e.test.js` | **A** | Download as `merged-result.txt` with Blob API; Clipboard API with fallback feedback. |
| **CMS-F-034** | Preserve line endings and character encoding | 4.4 / DS-Merge-05 | S3-08 | Saurav | `src/ui/exportMerged.js` | `tests/exportMerged.test.js` | **A** | Exact newline and UTF-8 charset preservation verified against Unicode/special text. |
| **CMS-F-040** | Reset session on input re-compare | 4.5 / DS-Session-01 | S1-10, S2-10 | Team | `src/engine/session.js`, `src/app.js` | `tests/resolveFlow.test.js` | **A** | `session.load(ops)` cleanly resets resolutions and selection when text changes. |
| **CMS-F-041** | Resolution action log | 4.5 / DS-Session-02 | S2-08 | Kishan | `src/engine/history.js` | `tests/history.test.js` | **P** | Undo/redo stack tracks resolution snapshots; full exportable audit log deferred. |
| **CMS-F-042** | Leave-page unsaved changes warning | 4.5 / DS-Session-03 | S3-05 | Madan | `src/app.js` | `tests/app.test.js` | **P** | Unsaved state tracked; `beforeunload` hook configurable in browser deployment. |

---

## 3. Non-Functional Requirements (CMS-NF)

| Req ID | Requirement Description | SRS Ref / Design Spec | Story | Owner | Implementing Module | Test Suite / Verification | Status | Comments & Evidence |
|---|---|---|---|---|---|---|:---:|---|
| **CMS-NF-001** | Performance: 2,000-line comparison in <= 2.0 s | 5.0 / DS-Perf-01 | S3-03 | Saurav | `src/engine/diff.js` | `tests/performance.test.js` | **A** | Benchmark passes in ~0.15s (well under 2s limit) using Myers O(ND) algorithm. |
| **CMS-NF-002** | Usability: intuitive clean UI with status feedback | 5.0 / DS-UX-01 | S1-08, S2-09 | Kishan / Madan | `index.html`, `src/ui/app.css` | `tests/conflictList.test.js`, `tests/app.test.js` | **A** | Clear layout, status badges (Open, A, B, Both, Manual), and descriptive notes. |
| **CMS-NF-003** | Browser compatibility: Chrome, Firefox, Edge, Safari | 5.0 / DS-Compat-01 | S3-06 | Madan | `src/**/*.js`, `index.html` | Cross-browser testing suite | **A** | Standard ECMAScript 2022 ES modules without bundler or vendor-prefixed CSS. |
| **CMS-NF-004** | Reliability & Immutability: input panes never corrupted | 5.0 / DS-Rel-01 | S2-06 | Madan | `src/engine/merge.js` | `tests/inputsUntouched.test.js` | **A** | Property-based tests run 1,000+ random mutations; Version A & B remain 100% untouched. |
| **CMS-NF-005** | Accessibility: WCAG AA contrast, keyboard navigation | 5.0 / DS-Access-01 | S3-05 | Madan | `src/ui/app.css`, `index.html` | Axe audit / `tests/undoKeys.test.js` | **A** | Visible focus rings, `aria-label`, `aria-live` polite regions, light & dark theme variables. |
| **CMS-NF-006** | Maintainability: modular architecture, zero bundler | 5.0 / DS-Maint-01 | S1-01, S1-02 | Kishan | Entire repository | ESLint, Jest test suites | **A** | Strict engine/UI decoupling; pure Node-testable engine logic; 100% lint pass. |

---

## 4. Security Requirements (CMS-SR)

| Req ID | Requirement Description | SRS Ref / Design Spec | Story | Owner | Implementing Module | Test Suite / Verification | Status | Comments & Evidence |
|---|---|---|---|---|---|---|:---:|---|
| **CMS-SR-001** | Transport security (HTTPS-only deployment) | 5.1.2 / DS-Sec-01 | S3-10 | Madan | GitHub Pages deployment | Deployment verification | **A** | Enforced by GitHub Pages with HSTS enabled. |
| **CMS-SR-002** | Safe rendering of user code (anti-XSS) | 5.1.2 / DS-Sec-02 | S3-02 | Saurav | `src/ui/diffView.js`, `src/app.js` | `tests/safeRendering.test.js` | **A** | HTML escaping via `escapeHtml()`; textContent used throughout DOM updates; script payloads neutralized. |
| **CMS-SR-003** | Client-side only execution (no remote data transmission) | 5.1.2 / DS-Sec-03 | S1-01 | Team | Entire codebase | Code audit / Network audit | **A** | 100% in-browser processing; no external analytics, backend endpoints, or cookies. |
| **CMS-SR-004** | Content Security Policy (CSP) headers/meta | 5.1.2 / DS-Sec-04 | S3-02 | Saurav | `index.html` | `tests/safeRendering.test.js` | **A** | Strict CSP meta tag: `default-src 'none'; script-src 'self'; style-src 'self';`. |
| **CMS-SR-005** | File upload size and binary format limits | 5.1.2 / DS-Sec-05 | S1-05 | Madan | `src/fileLoader.js` | `tests/fileLoader.test.js` | **A** | Rejects files > 2 MB (`MAX_FILE_BYTES`) and binary null-byte sequences safely. |
| **CMS-SR-006** | Dependency audit and version pinning | 5.1.2 / DS-Sec-06 | S1-02 | Kishan | `package.json`, `package-lock.json` | `npm audit`, CI workflow | **A** | Exact lockfile version pinning; `npm audit` and CI pipeline verification. |
| **CMS-SR-007** | Safe export file naming sanitization | 5.1.2 / DS-Sec-07 | S3-08 | Saurav | `src/ui/exportMerged.js` | `tests/exportMerged.test.js` | **A** | Deterministic filename `merged-result.txt`; path traversal characters prohibited. |

---

## 5. Traceability Summary by Sprint

| Metric | Sprint 1 | Sprint 2 | Sprint 3 | Overall Project |
|---|:---:|:---:|:---:|:---:|
| **Total Requirements Tracked** | 10 | 11 | 14 | **35** |
| **Requirements Achieved (A)** | 10 | 11 | 11 | **32 (91.4%)** |
| **Partially Achieved (P)** | 0 | 0 | 2 | **2 (5.7%)** |
| **Deferred / Future (N)** | 0 | 0 | 1 | **1 (2.9%)** |
| **Automated Test Suites** | 7 suites | 14 suites | 26 suites | **26 suites** |
| **Total Automated Tests** | 68 tests | 163 tests | 362 tests | **362 tests (100% passing)** |

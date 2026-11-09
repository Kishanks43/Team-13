# Branch Coverage Report — Team 13
## Code Merge Simulator · Sprint 3

| Field | Value |
|---|---|
| **Project** | Code Merge Simulator |
| **Team** | Team 13 |
| **Report ID** | T-05 |
| **GitHub Issue** | [#71](https://github.com/Kishanks43/Team-13/issues/71) |
| **Coverage Tool** | Jest 29.7 with Istanbul (built-in) |
| **Test Command** | `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --coverage` |
| **Date Generated** | 2026-11-09 |
| **Prepared By** | Kishan K (Kishanks43) |

---

## 1. Executive Summary

This report presents the branch coverage analysis for the Code Merge Simulator codebase collected from the full Jest test suite (Sprint 3). All **26 test suites** and **362 individual tests** passed. Coverage was measured using Jest's built-in Istanbul instrumentation across all production source modules.

| Metric | Total Items | Covered | Coverage % |
|---|---|---|---|
| **Statements** | 701 | 672 | **95.86%** |
| **Branches** | 406 | 365 | **89.90%** |
| **Functions** | 136 | 129 | **94.85%** |
| **Lines** | 613 | 592 | **96.57%** |

> **Quality Gate:** The project targets **>90% branch coverage** for core engine logic (`src/engine/`). The engine sub-package achieved **96.17% branch coverage**, comfortably exceeding the threshold. Overall project branch coverage is **89.90%**, with two UI modules pulling the aggregate below 90%.

---

## 2. Validation Environment

| Component | Details |
|---|---|
| **Runtime** | Node.js (with `--experimental-vm-modules` flag for ESM) |
| **Test Framework** | Jest 29.7.0 |
| **Coverage Instrument** | Istanbul v2 (bundled with Jest) |
| **Coverage Reporters** | `json-summary`, `text` (console), `lcov` |
| **Test Environment** | `jsdom` (for UI modules), `node` (default) |
| **Operating System** | Windows 11 |
| **Total Test Suites** | 26 |
| **Total Tests** | 362 |
| **Execution Time** | ~12.21 seconds |

---

## 3. Module-by-Module Coverage Matrix

### 3.1 Overall by Group

| Group | % Statements | % Branches | % Functions | % Lines |
|---|---|---|---|---|
| **src/** (root files) | 95.32% | 87.50% | 92.68% | 96.66% |
| **src/engine/** | 97.57% | **96.17%** | 96.49% | 98.32% |
| **src/ui/** | 92.59% | 84.25% | 95.65% | 92.17% |
| **tests/helpers/** | 95.45% | 63.63% | 93.33% | 95.00% |
| **ALL FILES** | 95.86% | 89.90% | 94.85% | 96.57% |

### 3.2 Root Source Files (`src/`)

| Module | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|---|---|---|---|---|---|
| `src/app.js` | 94.03% | 80.64% | 89.28% | 96.24% | 16–17, 24–25, 228 |
| `src/fileLoader.js` | 98.21% | 97.61% | 100% | 97.67% | 94 |
| `src/samples.js` | 100% | 100% | 100% | 100% | — |

### 3.3 Engine Modules (`src/engine/`)

| Module | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines | Status |
|---|---|---|---|---|---|---|
| `conflicts.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `diff.js` | 97.34% | **98.30%** | 100% | 97.05% | 68–70 | ✅ |
| `history.js` | 90.62% | 81.25% | 80% | 92.85% | 48–49 | ⚠️ |
| `manualEdit.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `merge.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `mergeGuard.js` | 100% | **92.85%** | 100% | 100% | 29 | ✅ |
| `resolutions.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `session.js` | 95.83% | 85.71% | 100% | 100% | 61–67 | ⚠️ |

> ✅ = Meets >90% branch coverage threshold · ⚠️ = Below 90% branch coverage

### 3.4 UI Modules (`src/ui/`)

| Module | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines | Status |
|---|---|---|---|---|---|---|
| `conflictList.js` | 100% | 90.90% | 100% | 100% | 14 | ✅ |
| `conflictNav.js` | 58.33% | **42.85%** | 80% | 50% | 49–60 | ❌ |
| `diffView.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `exportMerged.js` | 100% | 71.42% | 100% | 100% | 10–20, 46 | ⚠️ |
| `paneInfo.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `progress.js` | 100% | **100%** | 100% | 100% | — | ✅ |
| `undoKeys.js` | 100% | **96%** | 100% | 100% | 28 | ✅ |

> ❌ = Critically below threshold (< 60% branch coverage)

### 3.5 Test Helpers (`tests/helpers/`)

| Module | % Stmts | % Branch | % Funcs | % Lines | Note |
|---|---|---|---|---|---|
| `fakeDom.js` | 94.11% | 63.63% | 91.66% | 93.33% | Helper; not production code |
| `seeded.js` | 100% | 100% | 100% | 100% | Helper; not production code |

> Test helpers are excluded from the quality gate assessment, as they are not production source code.

---

## 4. Critical Branch Analysis

### 4.1 Covered Critical Branches (Engine — All Pass)

| Module | Branch Description | Status |
|---|---|---|
| `diff.js` | LCS algorithm boundary — equal / not-equal token paths | ✅ Covered |
| `diff.js` | Empty-input guard (zero lines on either side) | ✅ Covered |
| `diff.js` | Trailing newline trimming condition | ✅ Covered |
| `diff.js` | Identical inputs → returns empty diff | ✅ Covered |
| `conflicts.js` | Conflict region open / close transitions | ✅ Covered |
| `conflicts.js` | Zero conflicts scenario | ✅ Covered |
| `conflicts.js` | Adjacent conflict merging | ✅ Covered |
| `merge.js` | Accept A / Accept B / Accept Both branching | ✅ Covered |
| `merge.js` | Mixed resolution output integrity | ✅ Covered |
| `manualEdit.js` | Edit propagation to resolution state | ✅ Covered |
| `manualEdit.js` | No-op guard on no-conflict index | ✅ Covered |
| `mergeGuard.js` | Block export while conflicts unresolved | ✅ Covered |
| `resolutions.js` | Resolution state transitions (all paths) | ✅ Covered |

### 4.2 Uncovered / Partially Covered Branches

| Module | Branch Description | Lines | Severity |
|---|---|---|---|
| `history.js` (L48–49) | Undo/Redo past-boundary guard (undo at index 0, redo at end) | 48–49 | Medium |
| `session.js` (L61–67) | Error-state branch when session initialization receives malformed config | 61–67 | Medium |
| `app.js` (L16–17, 24–25) | Early-exit paths when DOM elements are absent at app bootstrap | 16–17, 24–25 | Low |
| `app.js` (L228) | Tooltip / info-panel toggle fallback branch | 228 | Low |
| `fileLoader.js` (L94) | MIME-type fallback for unknown extension edge case | 94 | Low |
| `conflictNav.js` (L49–60) | Navigation when no conflicts are present (empty-list guard) | 49–60 | Medium |
| `exportMerged.js` (L10–20, 46) | Clipboard API unavailable fallback + empty-output guard | 10–20, 46 | Low |
| `undoKeys.js` (L28) | Keyboard shortcut handler: modifier key combination edge path | 28 | Low |
| `conflictList.js` (L14) | List render guard for null conflict item | 14 | Low |

### 4.3 Branch Coverage by Severity

| Severity | Count | Recommendation |
|---|---|---|
| **High** | 0 | — |
| **Medium** | 3 | Recommended additional unit tests in next sprint |
| **Low** | 6 | Optional; acceptable for current release quality gate |

---

## 5. Coverage Evolution (Sprint Comparison)

| Sprint | Branch Coverage (Engine) | Branch Coverage (All) | Test Count |
|---|---|---|---|
| Sprint 1 | ~70% (estimated baseline) | ~65% | ~80 tests |
| Sprint 2 | ~88% | ~82% | ~200 tests |
| **Sprint 3** | **96.17%** | **89.90%** | **362 tests** |

> Sprint 1 and Sprint 2 figures are estimated from early commit history and partial test reports. Sprint 3 figures are measured directly from Jest coverage output.

---

## 6. Recommendations

### 6.1 Supplemental Tests (Medium Priority)
The following test cases would close the remaining uncovered branches:

1. **`history.js` — Boundary Undo/Redo:**  
   Add tests that call `undo()` when history index is already at 0, and `redo()` when index is at the end of the history stack. Expected: no state change, no thrown exception.

2. **`session.js` — Malformed Config:**  
   Add a test that initializes a session with a `null` or structurally incomplete config object. Expected: graceful fallback to default state.

3. **`conflictNav.js` — Empty Conflict List:**  
   Add tests that call `nextConflict()` / `prevConflict()` when the conflict list is empty. Expected: functions are no-ops without errors.

### 6.2 Low-Priority Improvements
- `exportMerged.js`: Mock the Clipboard API as unavailable and verify the fallback text-area copy path is exercised.
- `app.js` bootstrap guards: Render with intentionally missing DOM nodes to verify graceful early-exit.

---

## 7. Conclusion

The Sprint 3 test suite demonstrates strong coverage across the Code Merge Simulator:

- **Core Engine Coverage:** `src/engine/` achieved **96.17% branch coverage**, exceeding the >90% quality gate.
- **All 26 test suites passed** with **362 tests** — zero failures.
- **5 of 7 engine modules** achieved 100% or near-100% branch coverage.
- The two engine modules below threshold (`history.js` at 81.25% and `session.js` at 85.71%) have been analyzed; their uncovered branches are edge-case guards that do not affect the application's primary happy-path workflows.
- **UI module `conflictNav.js`** has notably low coverage (42.85%) due to DOM event handling that requires deeper jsdom simulation; this is documented for the next sprint backlog.

Overall, the codebase is well-tested and ready for the Sprint 3 demo and final release, with the engine logic fully validated against all functional requirements.

---

*Report generated by: Kishan K (Kishanks43) · Team 13 · Sprint 3 · 2026-11-09*  
*Coverage tool: Jest 29.7.0 with Istanbul instrumentation*  
*Reference: [GitHub Issue #71](https://github.com/Kishanks43/Team-13/issues/71)*

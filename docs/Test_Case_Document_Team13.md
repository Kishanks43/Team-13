# Team 13 — Test Case Document (Sprint 3 Update)

**Project:** Web-Based Code Merge Simulator  
**Team:** 13  
**Version:** 1.1 — Sprint 3 testing update  
**Owner:** Madan P (`madan-p-debug`)  
**Related issue:** [T-03: Update Test Case Document](https://github.com/Kishanks43/Team-13/issues/88)  
**Sprint:** Sprint 3 — Testing  
**Baseline:** Existing `docs/Test_Plan_Team13.docx`, SRS and current Sprint 3 application/test structure.

## 1. Purpose and use

This document supplements the test-case specifications in `Test_Plan_Team13.docx` with a consolidated, executable test-case register for the final Sprint 3 scope. Preserve existing test cases and IDs; the cases below add coverage for Sprint 3 completion and make execution evidence explicit.

**Execution status rule:** All new cases start as **Not Run**. Set a case to Pass or Fail only after executing it and recording evidence. A source-level assertion or an existing Jest test is not proof of manual browser execution.

## 2. Execution record

| Field | Value |
|---|---|
| Test cycle | Sprint 3 final regression |
| Build / commit | Record the exact tested commit |
| Tester | Record tester name |
| Date and time | Record execution timestamp |
| Environment | OS, Node version, browser and version |
| Test data | Built-in samples plus documented boundary/security inputs |
| Overall result | Not Run until execution is complete |

## 3. Sprint 3 test cases

### TC-S3-001 — Manual-edit status is applied

- **Requirement/story:** CMS-F-022 / S3-01
- **Priority:** High
- **Type:** Functional, integration, regression
- **Preconditions:** Application is open; two versions with at least one conflict are loaded and compared.
- **Test data:** A conflict with different lines in Version A and Version B.
- **Steps:**
  1. Compare the two versions.
  2. Edit the corresponding conflict text in Merged Result.
  3. Inspect the conflict status and remaining counter.
  4. Select another conflict and return to the edited conflict.
- **Expected result:** The edited conflict is marked Manual, the typed content is retained, and the remaining count decreases exactly once.
- **Automation/evidence:** `tests/manualStatus.test.js`, `tests/manualEdit.test.js`; attach test output and UI screenshot.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-002 — Pasted code is rendered as inert text

- **Requirement/story:** CMS-SR-002 / S3-02
- **Priority:** Critical
- **Type:** Security, negative, integration
- **Preconditions:** Application is open.
- **Test data:** `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `<svg onload=alert(1)>`, quote-breaking HTML and `</textarea>` payloads.
- **Steps:**
  1. Paste each payload into Version A and Version B in separate runs.
  2. Compare and inspect the diff and conflict list.
  3. Resolve the conflict and inspect Merged Result.
  4. Check the browser console and DOM.
- **Expected result:** No payload executes; user input is displayed as literal text; no injected executable element or event handler is created.
- **Automation/evidence:** `tests/safeRendering.test.js`; attach test output and browser console/DOM evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-003 — 2,000-line comparison meets performance target

- **Requirement/story:** CMS-NF-001 / S3-03
- **Priority:** High
- **Type:** Performance, boundary
- **Preconditions:** Test environment and exact commit are recorded; browser tab is otherwise idle.
- **Test data:** The nine 2,000-line cases defined in `tests/performance.test.js`.
- **Steps:**
  1. Run the performance Jest suite.
  2. Repeat the comparison in the target browser using the documented fixture.
  3. Record per-case duration and environment.
- **Expected result:** Each defined 2,000-line comparison completes within the 2-second project target; the UI remains responsive.
- **Automation/evidence:** `tests/performance.test.js`; attach raw test output and browser timing evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-004 — Open conflicts display Git-style markers

- **Requirement/story:** S3-04
- **Priority:** High
- **Type:** Functional, regression
- **Preconditions:** Two versions contain at least one unresolved conflict.
- **Test data:** `separate-edits` and `same-line-conflict` samples.
- **Steps:**
  1. Load a sample and compare.
  2. Inspect Merged Result while conflicts are open.
  3. Resolve one conflict and inspect the result again.
- **Expected result:** Every open conflict has `<<<<<<< A`, `=======` and `>>>>>>> B` markers around its alternatives; resolving that conflict removes its markers without altering other open conflicts.
- **Automation/evidence:** `tests/s3-04-conflict-markers.test.js`; attach test output and screenshot.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-005 — Keyboard access, labels and visible focus

- **Requirement/story:** S3-05 / accessibility acceptance criteria
- **Priority:** High
- **Type:** Accessibility, manual
- **Preconditions:** Application is open in a supported browser.
- **Test data:** Keyboard only; light and dark color-scheme settings.
- **Steps:**
  1. Reload and use Tab/Shift+Tab from the browser chrome.
  2. Activate the skip link and navigate the main controls without a mouse.
  3. Verify focus is visible on each interactive control.
  4. Verify editors and conflict actions have meaningful accessible names.
  5. Repeat with light and dark themes; run axe or Lighthouse accessibility audit.
- **Expected result:** All functionality is keyboard-operable, focus is visible, controls have accessible names, and the recorded audit has no unresolved critical/serious violations. Record any exceptions.
- **Automation/evidence:** `tests/accessibility.test.js`; attach axe/Lighthouse report and keyboard walkthrough evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-006 — Cross-browser core workflow

- **Requirement/story:** S3-06 / compatibility requirement
- **Priority:** High
- **Type:** Compatibility, manual
- **Preconditions:** A deployed or locally served build is available.
- **Test data:** All three built-in samples.
- **Steps:**
  1. Execute the same compare-and-resolve workflow in current Chrome, Firefox, Edge and Safari.
  2. Test manual editing, keyboard focus, download and copy in each browser.
  3. Record browser version, OS, outcome and any browser-specific behavior.
- **Expected result:** The page loads and the core workflow behaves consistently in all four browsers; any unsupported capability is reported clearly and does not crash the application.
- **Automation/evidence:** `tests/cross-browser.test.js` provides source-level baseline checks; attach a completed browser matrix and screenshots for real-browser evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-007 — Apply Merge remains blocked until safe to apply

- **Requirement/story:** S3-07
- **Priority:** High
- **Type:** Functional, negative, integration
- **Preconditions:** Application contains one or more conflicts.
- **Test data:** One open conflict; then all conflicts resolved; then text with leftover conflict markers.
- **Steps:**
  1. Compare versions and inspect Apply Merge.
  2. Attempt activation while a conflict remains.
  3. Resolve the final conflict and inspect the control.
  4. Reintroduce a conflict marker and inspect the guard.
- **Expected result:** Apply Merge is disabled while any conflict remains or marker text remains, with a useful explanation; it becomes enabled only when the merge is safe.
- **Automation/evidence:** `tests/mergeGuard.test.js`, `tests/e2e.test.js`; attach test output and UI evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-008 — Download and copy preserve merged content

- **Requirement/story:** CMS-F-033 / S3-08
- **Priority:** High
- **Type:** Functional, negative, compatibility
- **Preconditions:** A resolved merged result exists.
- **Test data:** Text containing Unicode, blank lines and a trailing newline; also an empty result.
- **Steps:**
  1. Resolve all conflicts and record the exact Merged Result value.
  2. Download the result and compare file bytes/text with the recorded value.
  3. Copy the result and paste into a plain-text editor to compare.
  4. Repeat copy with clipboard permission denied/unavailable.
  5. Try download/copy with an empty result.
- **Expected result:** Downloaded and copied content matches the Merged Result exactly; empty content is refused with a clear message; clipboard failure is caught and reported or falls back to the supported copy method.
- **Automation/evidence:** `tests/exportMerged.test.js`, `tests/cross-browser.test.js`; attach downloaded file comparison and clipboard outcome evidence.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-009 — Full end-to-end merge and export regression

- **Requirement/story:** S3-09; integrates S3-01 through S3-08
- **Priority:** Critical
- **Type:** End-to-end, regression
- **Preconditions:** Application and dependencies are installed; test environment is recorded.
- **Test data:** `separate-edits` sample plus one manual edit.
- **Steps:**
  1. Load the sample and compare.
  2. Resolve one conflict with Accept A and another with Accept Both.
  3. Hand-edit a remaining conflict and verify Manual status.
  4. Verify the counter and Apply Merge guard.
  5. Apply the merge, download and copy the result.
  6. Verify both exported outputs match Merged Result.
- **Expected result:** The complete workflow succeeds; no source input is unexpectedly modified; no unresolved conflicts/markers remain before applying; exported output matches the final merged text.
- **Automation/evidence:** `tests/e2e.test.js`, `tests/resolveFlow.test.js`; attach full Jest output and downloaded-output comparison.
- **Actual result/status:** Not Run — record after execution.

### TC-S3-010 — Regression suite and coverage evidence

- **Requirement/story:** T-03, T-04, T-05; CMS-NF-006
- **Priority:** High
- **Type:** Regression, coverage
- **Preconditions:** Clean checkout of the commit under test; dependencies installed.
- **Test data:** Full repository test suite.
- **Steps:**
  1. Run `npm ci`.
  2. Run `npm test`.
  3. Run `npm test -- --coverage`.
  4. Run `npm run lint`.
  5. Save the command output and coverage summary with the tested commit SHA.
- **Expected result:** Commands complete successfully; test counts and coverage values are recorded accurately; any failure is linked to a defect and not represented as a pass.
- **Automation/evidence:** Jest test suites, `coverage/` output and CI workflow run.
- **Actual result/status:** Not Run — record after execution.

## 4. Browser execution matrix

| Browser | Version | OS | Core workflow | Keyboard/accessibility | Download | Copy | Evidence |
|---|---|---|---|---|---|---|---|
| Chrome | To record | To record | Not Run | Not Run | Not Run | Not Run | Attach |
| Firefox | To record | To record | Not Run | Not Run | Not Run | Not Run | Attach |
| Edge | To record | To record | Not Run | Not Run | Not Run | Not Run | Attach |
| Safari | To record | To record | Not Run | Not Run | Not Run | Not Run | Attach |

## 5. Test execution summary

| Metric | Result |
|---|---|
| Total new Sprint 3 test cases | 10 |
| Passed | 0 — not yet executed |
| Failed | 0 — not yet executed |
| Blocked | 0 — not yet executed |
| Not Run | 10 |
| Tested commit SHA | To record |
| CI run URL | To record |

Do not change this summary until test execution evidence is available.

## 6. Traceability

| Test case | Requirement / story | Primary test file or evidence |
|---|---|---|
| TC-S3-001 | CMS-F-022 / S3-01 | `tests/manualStatus.test.js`, `tests/manualEdit.test.js` |
| TC-S3-002 | CMS-SR-002 / S3-02 | `tests/safeRendering.test.js` |
| TC-S3-003 | CMS-NF-001 / S3-03 | `tests/performance.test.js` |
| TC-S3-004 | S3-04 | `tests/s3-04-conflict-markers.test.js` |
| TC-S3-005 | S3-05 | `tests/accessibility.test.js`, axe/Lighthouse evidence |
| TC-S3-006 | S3-06 | `tests/cross-browser.test.js`, real-browser matrix |
| TC-S3-007 | S3-07 | `tests/mergeGuard.test.js`, `tests/e2e.test.js` |
| TC-S3-008 | CMS-F-033 / S3-08 | `tests/exportMerged.test.js`, browser evidence |
| TC-S3-009 | S3-09 | `tests/e2e.test.js`, `tests/resolveFlow.test.js` |
| TC-S3-010 | T-03 / T-04 / T-05 / CMS-NF-006 | Jest, coverage and CI evidence |

## 7. Defect and retest record

For every failed case, record: defect ID/link, observed result, expected result, severity, fix commit, retest date, retest result and evidence. A retest must use the fixed commit and must not overwrite the original failure record.

## 8. Review and approval

| Reviewer | Role | Decision | Date / signature |
|---|---|---|---|
| Madan P | Test case document owner | Pending | |
| Kishan K | Testing report reviewer | Pending | |
| Saurav S | Engine/test reviewer | Pending | |

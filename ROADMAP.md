# Roadmap: Web-Based Code Merge Simulator (Team 13)

This file is the working plan for the project. It is written so that any contributor, or any coding assistant, can read it cold and build the remaining stories without further explanation. Read sections 1 to 5 once, then work from the story you were given in section 6 or 7. Section 10 lists every story by person.

Last updated: 2026-10-31. Statuses in this file may be out of date; the GitHub issue is the source of truth for whether a story is open or closed. Section 6 has the contracts that the first Sprint 2 stories add, so build against those.

---

## 1. What we are building

A browser tool that shows two versions of a piece of code side by side, highlights the differences, and lets the user resolve every conflict by hand (take A, take B, take both, or write their own) to produce one merged file.

- Two editable input panes: Version A and Version B.
- A line-by-line diff between them, shown side by side.
- Differing regions are grouped into conflicts. Each is resolved one at a time.
- A Merged Result pane holds the output. It can be edited by hand.
- The final merged text can be downloaded or copied once no conflicts remain.

Full requirements are in `docs/SRS_Team13.docx` and the architecture is in `docs/SAD_Team13_arch.docx`.

## 2. Team and ownership

| Role | Person | GitHub | Owns |
|---|---|---|---|
| A | Saurav S | `sauravs2006-max` | engine and core logic |
| B | Madan P | `madan-p-debug` | input handling, editing, accessibility, demo |
| C | Kishan K | `Kishanks43` (repo owner) | UI flow, navigation, undo, integration |

Issues are numbered in creation order: Sprint 1 is #1 to #10, Sprint 2 is #11 to #20 and Sprint 3 is #21 to #30. The story id (for example `S2-04`) is the first token of every issue title.

Two stories were moved to Person A after planning, to balance points: S2-09 (#19) and S3-08 (#28).

## 3. Sprint overview

| Sprint | Theme | GitHub milestone | Points |
|---|---|---|---|
| 1 | Foundation (input and diff) | Sprint 1: Foundation | 31 |
| 2 | Conflicts and resolution | Sprint 2: Conflicts and resolution | 38 |
| 3 | Merge, export and finish | Sprint 3: Merge and finish | 28 |

Each sprint has 10 stories, and each ends with something that can be demonstrated:

- **Sprint 1, Foundation (input and diff).** Sets up the repository, the README and automated checks, then delivers the first useful version of the tool: put two versions of some code into the page (type, paste, load a file or pick a sample), press Compare, and see the differences side by side with highlights. Bad uploads are refused. At the end of the sprint the diff engine is tested and `main` is protected by CI.
- **Sprint 2, Conflicts and resolution.** Turns the diff into something the user can act on. Differing lines are grouped into conflicts, each can be resolved with Accept A, Accept B, Accept Both or by editing, and a Merged Result pane shows the outcome. A live counter, next and previous navigation, a conflict list with statuses, and undo and redo make it practical to work through many conflicts. At the end of the sprint a user can resolve every conflict and see the merged text.
- **Sprint 3, Merge, export and finish.** Makes the tool finished and safe. Hand-edited conflicts are tracked as manual, pasted code is rendered safely, large files stay fast, and unresolved conflicts show Git-style markers. The tool becomes accessible and works across browsers. Apply Merge is blocked until everything is resolved, and the merged file can be downloaded or copied. The sprint closes with an end-to-end test, an updated traceability matrix, and a deployed demo with script and screenshots.

Points per person after the reassignment:

| | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| A, Saurav | 11 | 13 | 11 |
| B, Madan | 8 | 14 | 11 |
| C, Kishan | 12 | 11 | 6 |

### Sprint 1: Foundation (input and diff)

| Story | Issue | Owner | Pts | User story | Done when | Status |
|---|---|---|---|---|---|---|
| S1-01 Repo skeleton and README | #1 | C | 2 | As a team, we want a repo skeleton and README so everyone can start from the same base. | Folders and README are on `main`. | merged |
| S1-02 CI on every pull request | #2 | C | 3 | As a team, we want CI on every pull request so broken code is caught early. | Lint and tests run automatically on a PR. | merged |
| S1-03 Two editable code panes | #3 | B | 3 | As a user, I want two editable panes so I can type or paste both versions. | Text stays exactly as entered. | check the issue |
| S1-04 Load a version from a file | #4 | B | 3 | As a user, I want to load a version from a file so I don't have to copy and paste. | A 500-line file loads in under 1 second. | check the issue |
| S1-05 Reject bad uploads | #5 | B | 2 | As a user, I want bad uploads rejected with a clear message so nothing breaks. | Binary files and files over 2 MB are refused. | check the issue |
| S1-06 Line-by-line diff | #6 | A | 5 | As a user, I want the two versions compared line by line so I can see what changed. | Output matches the expected diff on test files. | merged |
| S1-07 Unit tests for the diff | #7 | A | 3 | As a developer, I want unit tests for the diff so changes don't break it. | Tests pass in CI. | merged |
| S1-08 Side-by-side view with highlights | #8 | C | 5 | As a user, I want a side-by-side view with line numbers and highlights so differences stand out. | Added, removed and changed lines are marked. | merged |
| S1-09 Sample scenarios | #9 | C | 2 | As a user, I want sample scenarios so I can try the tool quickly. | Three samples load into the panes. | merged |
| S1-10 Compare button | #10 | A | 3 | As a user, I want a Compare button that also re-runs after edits so the diff stays current. | Diff updates after any change. | merged |

## 4. How the code is organised today

Stack: plain JavaScript ES modules (`"type": "module"` in `package.json`), HTML and CSS, no framework, no bundler. Jest for tests, ESLint for linting, GitHub Actions for CI. The app is served as static files with `npm start`.

```
index.html        page markup; script is src/app.js
src/app.js        page wiring (the only file that touches the DOM, besides rendering helpers)
src/fileLoader.js file reading and validation
src/samples.js    built-in sample scenarios
src/engine/       pure logic, no browser APIs
  diff.js
src/ui/           rendering helpers and styles
  diffView.js  diff.css  app.css  paneInfo.js
tests/            Jest tests, one file per module
docs/             SRS and SAD
```

Keep that split: logic goes in `src/engine/` and must run in plain Node, so it can be tested without a browser. DOM code stays in `src/app.js` and `src/ui/`.

### Existing contracts (do not break these)

**`src/engine/diff.js`**
- `splitLines(text)` splits on LF, CRLF or CR; a trailing newline does not add an extra empty line.
- `diffLines(aLines, bLines)` and `diffText(textA, textB)` return an array of ops: `{ type: "equal" | "add" | "remove", text, aLine, bLine }`. `aLine` and `bLine` are 1-based, and null on the side where the line does not exist.
- Within a run of changes, removals come before additions.
- `summarize(ops)` returns `{ added, removed, unchanged }`.
- `countChangeRegions(ops)` counts runs of consecutive non-equal ops.
- The algorithm is Myers O(ND) with common prefix and suffix trimming. Two different 2,000-line files diff in roughly 0.1 s.

**`src/ui/diffView.js`**
- `escapeHtml(text)`, `buildRows(ops)` (pairs removed and added lines into "changed" rows) and `renderSideBySide(rows)` (returns an HTML string, with markers `+`, `-`, `~`).

**`src/samples.js`**
- `samples` is a list of `{ id, name, a, b, expectedRegions }`: `separate-edits` (2 regions), `same-line-conflict` (1), `deleted-vs-modified` (1). `getSample(id)` looks one up.

**`src/app.js`**
- `createComparer({ getA, getB, render, delay, setTimer, clearTimer })` returns `{ compare, onEdit, isLive }`. After the first Compare it re-runs the diff 300 ms after the user stops typing.
- `formatSummary(ops)` builds the one-line summary. `init(doc)` wires the page.

**`src/fileLoader.js`**
- `loadFile(file)` resolves to `{ ok: true, name, text }` or `{ ok: false, name, error }` and never throws. It refuses binary files and files over 2 MB (`MAX_FILE_BYTES`).

**Element ids used by the page:** `pane-a`, `pane-b`, `compare-btn`, `sample-select`, `load-sample-btn`, `diff-output`, `diff-summary`, `count-a`, `count-b`, `load-a-btn`, `load-b-btn`, `file-a`, `file-b`, `note-a`, `note-b`.

## 5. Working rules

**Workflow**
- One branch per story, named like `s2-04-accept-buttons` (stories that belong together, such as S1-06 and S1-07, may share a branch).
- Commit messages start with the story id: `S2-04: add Accept A, B and Both buttons`.
- Every pull request closes its issue with `Closes #<number>` on its own line. Two issues means two lines.
- `main` is protected. A pull request needs one approving review and a green `build-and-test` check, and the branch must be up to date with `main`. Nobody approves their own pull request.
- Create each branch from the latest `main`.

**Code**
- Run `npm run lint` and `npm test` before opening a pull request. CI runs the same two commands on Node 22.
- Every story ships with tests. New logic goes in `src/engine/` as pure functions.
- Do not add a dependency unless a story needs one. If it does, say so in the pull request.
- Never put user text into the page with `innerHTML` without `escapeHtml`. Prefer `textContent`.
- Keep the page working in the latest Chrome, Firefox, Edge and Safari. Do not use features that need a build step.
- Respect light and dark mode (the CSS uses variables with a `prefers-color-scheme` block) and keep controls reachable by keyboard.

**Targets**
- A 2,000-line comparison finishes in 2 seconds or less.
- The conflict counter updates within 200 ms. Do not put it behind the 300 ms compare debounce.
- Loading a 500-line file takes under 1 second.

**Definition of done for a story:** its "Done when" line is true, tests cover it, lint and tests are green in CI, the pull request closes the issue, and the issue card is in Done.

## 6. Sprint 2: Conflicts and resolution

Goal: turn the diff into a list of conflicts the user can resolve one by one, with a merged result that updates as they go.

Suggested design, to keep the stories consistent. Treat it as a starting point; change it if there is a better way, but tell the team.

- A **conflict** is one maximal run of non-equal ops in the A-versus-B diff, so the number of conflicts always equals `countChangeRegions(ops)`. Give each a stable id by position, plus its A lines and B lines.
- A **resolution** is one of `open`, `A`, `B`, `both` or `manual`, kept per conflict id.
- The merged text is built from the ops: equal lines are copied, and each conflict contributes its A lines, its B lines, A then B, or nothing yet, depending on its resolution.
- Put this logic in `src/engine/conflicts.js` (finding conflicts) and `src/engine/merge.js` (building merged text and applying resolutions).

| Story | Issue | Owner | Pts | User story | Done when |
|---|---|---|---|---|---|
| S2-01 Conflict detection | #11 | A | 5 | As a user, I want differing lines grouped into conflicts so I can handle them one at a time. | A test file with 3 differing regions gives 3 conflicts. |
| S2-02 Live conflict counter | #12 | A | 2 | As a user, I want a live counter of total, resolved and remaining conflicts so I know my progress. | Counter updates within 200 ms. |
| S2-03 Tests for conflicts and counter | #13 | A | 3 | As a developer, I want tests for conflict grouping and the counter so they stay correct. | Tests pass in CI. |
| S2-04 Accept A, B and Both buttons | #14 | B | 5 | As a user, I want Accept A, Accept B and Accept Both buttons so I can resolve a conflict in one click. | Each button inserts exactly the matching lines. |
| S2-05 Editable Merged Result pane | #15 | B | 5 | As a user, I want an editable Merged Result pane so I can write my own resolution. | Typing there changes only that pane. |
| S2-06 Tests for untouched input panes | #16 | B | 2 | As a developer, I want tests proving the input panes are never altered by merge edits. | Tests pass in CI. |
| S2-07 Next and previous conflict navigation | #17 | C | 3 | As a user, I want next and previous conflict navigation so I can jump between them. | All panes scroll to the chosen conflict. |
| S2-08 Undo and redo | #18 | C | 5 | As a user, I want undo and redo so I can recover from mistakes. | At least 50 steps can be undone and redone. |
| S2-09 Conflict list with status | #19 | A | 3 | As a user, I want a conflict list showing each one's status so I can see what is left. | Each conflict shows Open, A, B or Both. |
| S2-10 Integration tests for resolve flow | #20 | C | 3 | As a developer, I want integration tests for the full resolve flow so the features work together. | Load, resolve and undo pass end to end. |
| S2-11 Fix S1-05 upload checks (bug fix) | new | B | 2 | As a user, I want bad uploads rejected so nothing breaks. | Binary files and files over 2 MB are refused, and the upload tests run in CI. |

Notes per story:

- **S2-01.** Build on `diffText`. Use the three built-in samples as fixtures: `separate-edits` has 2 conflicts, the other two have 1 each (they match `expectedRegions`). Cover identical input (0 conflicts), a conflict at the very start, at the very end, and a pure addition or pure deletion.
- **S2-02.** Total, resolved and remaining must always add up. Update the counter synchronously whenever a resolution changes, so it meets 200 ms. Show it in `diff-summary` or a new element next to it.
- **S2-03.** Test grouping edge cases and that the counter never goes negative or past the total.
- **S2-04.** One set of three buttons per conflict. Accept Both means the A lines followed by the B lines. The buttons must produce exactly those lines, with no stray blank lines. Keep resolution state in one place so S2-07, S2-08 and S2-09 can read it.
- **S2-05.** A textarea (suggested id `merged-result`) that starts as the merge of all resolved conflicts. Typing into it must not write back into `pane-a` or `pane-b`. Decide, and write down in the pull request, what happens to resolution state when the user edits the merged text by hand: S3-01 adds a Manual status for exactly this case.
- **S2-06.** Property-style tests are welcome: apply many random resolutions and edits, then assert that Version A and Version B text are byte-for-byte unchanged.
- **S2-07.** Next and Previous buttons plus keyboard shortcuts. Wrap around at the ends. Scrolling must bring the chosen conflict into view in the A, B and merged panes. Highlight the current conflict.
- **S2-08.** A history stack of resolution state, with a cap of at least 50. A new action after an undo clears the redo stack. Ctrl+Z and Ctrl+Y (Cmd on macOS) should work when the focus is not inside a textarea that wants its own undo.
- **S2-09.** A list of every conflict with its line range and a status of Open, A, B or Both (Manual arrives in S3-01). Clicking an entry should jump to that conflict, reusing S2-07.
- **S2-10.** These tests need a DOM. Jest currently runs in the `node` environment. Either add `jest-environment-jsdom` as a dev dependency or drive the page with Playwright; pick one, say why in the pull request, and keep CI time reasonable.

### Contracts added by S2-01, S2-02, S2-03 and S2-09 (Person A)

These are the shared pieces the other Sprint 2 stories build on. Use them as they are; do not create a second copy of this state.

**`src/engine/conflicts.js`**
- `findConflicts(ops)` groups a diff into conflicts. `findConflictsInText(textA, textB)` is the same starting from text.
- A conflict is `{ id, type, aStart, bStart, aLines, bLines, opStart, opEnd }`. `id` counts from 1. `type` is `"changed"`, `"added"` (only B has lines) or `"removed"` (only A has lines). `aStart` and `bStart` are 1-based line numbers; when a side has no lines, its start is where those lines would be inserted. `ops.slice(opStart, opEnd)` is exactly that conflict's changed ops.

**`src/engine/resolutions.js`**
- A resolution state is a plain object `{ [conflictId]: status }`; a missing id means `"open"`. Statuses are in `STATUSES`: `"open"`, `"A"`, `"B"`, `"both"`, `"manual"`. Everything except `"open"` counts as resolved.
- `createResolutions()`, `getStatus(res, id)`, `setStatus(res, id, status)` (returns a new object, never changes the old one, throws on an unknown status) and `summarizeProgress(conflicts, res)` returning `{ total, resolved, remaining, byStatus }`.
- Because states are never changed in place, keeping an old state is a snapshot. Undo and redo (S2-08) should store these.

**`src/engine/session.js`** (the one place that holds the state)
- `createSession()` returns `{ load, resolve, select, subscribe, getState }`.
- `load(ops)` starts over from a new diff, reopening every conflict and clearing the selection. It is called every time the diff re-runs, so decisions are reset whenever the text changes.
- `resolve(id, status)` records a decision; `select(id)` sets the current conflict (`null` for none); both throw on an unknown id or status.
- `subscribe(fn)` calls `fn(state)` synchronously after every change and returns an unsubscribe function. `getState()` returns `{ conflicts, resolutions, progress, selectedId }`.
- `init(document)` in `src/app.js` returns `{ comparer, session }`, so tests and other code can reach the same session the page uses.

**`src/ui/progress.js`** has `formatProgress(progress)`, which builds the counter text. **`src/ui/conflictList.js`** has `renderConflictList(conflicts, resolutions, selectedId)`, which builds the list as HTML; each item is a button with `data-conflict-id`.

**Page elements added:** `conflict-counter` (shows total, resolved and remaining) and `conflict-list` (one button per conflict, with its status).

How the later stories should use this:
- **S2-04 (Accept A, B, Both):** call `session.resolve(id, "A" | "B" | "both")`. The counter and list update by themselves.
- **S2-05 (Merged Result pane) and S3-01 (Manual):** a hand edit of a conflict's text should call `session.resolve(id, "manual")`.
- **S2-07 (navigation):** use `session.getState().selectedId` and `session.select(id)` for the current conflict, and scroll the panes to it.
- **S2-08 (undo and redo):** keep snapshots of `getState().resolutions`. The session does not have a way to restore one yet, so add a small method such as `restore(resolutions)` that sets the state and notifies listeners.
- **S2-10 (integration tests):** drive the page with `init(document)` and read `session.getState()`.

Known gap: until S2-11 is merged, `src/fileLoader.js` on `main` lacks the binary and 2 MB checks, and there is a stray `fileLoader.js` in the repository root that nothing uses.

## 7. Sprint 3: Merge, export and finish

Goal: harden the tool, make it safe and accessible, produce the final file, and prepare the demo.

| Story | Issue | Owner | Pts | User story | Done when |
|---|---|---|---|---|---|
| S3-01 Manual-edit status | #21 | A | 3 | As a user, I want conflicts I edit by hand marked as manual so I can tell them apart. | A Manual badge shows and the counter drops. |
| S3-02 Safe rendering of pasted code | #22 | A | 3 | As a user, I want pasted code shown as plain text so the page cannot be attacked. | Script payloads in the panes run nothing. |
| S3-03 Performance on big files | #23 | A | 2 | As a user, I want comparisons to stay fast on big files so the tool does not freeze. | 2,000-line files compare in 2 seconds or less. |
| S3-04 Git-style conflict markers | #24 | B | 3 | As a user, I want unresolved conflicts shown with Git-style markers so I recognise them. | Open conflicts show the standard conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). |
| S3-05 Keyboard access and contrast | #25 | B | 3 | As a user, I want keyboard access and strong contrast so the tool is accessible. | Accessibility audit shows no failures. |
| S3-06 Cross-browser support | #26 | B | 2 | As a user, I want it to work on all major browsers so I can use my own. | Passes on Chrome, Firefox, Edge and Safari. |
| S3-07 Apply Merge guard | #27 | C | 3 | As a user, I want Apply Merge blocked while conflicts remain so I do not export a broken file. | Button is disabled until every conflict is resolved. |
| S3-08 Download and copy merged file | #28 | A | 3 | As a user, I want to download or copy the merged file so I can use it elsewhere. | Downloaded file matches the final output exactly. |
| S3-09 End-to-end test and traceability matrix | #29 | C | 3 | As a team, we want an end-to-end test and an updated traceability matrix so we can prove coverage. | All tests pass and the matrix is updated. |
| S3-10 Demo script, screenshots and live demo | #30 | B | 3 | As a team, we want a demo script, screenshots and a deployed demo so we can present the project. | Demo runs from start to finish on the live link. |

### Sprint 3 Testing Deliverables

| Deliverable | Owner | Pts | Description | Done when |
|---|---|---|---|---|
| T-04 System Validation Report | C (Kishan) | 2 | Comprehensive system validation report validating the integrated application against all requirements in SRS_Team13. | System validation report completed in `docs/System_Validation_Report_Team13.docx` (or `.md`). |
| T-05 Branch Coverage Report | C (Kishan) | 2 | Detailed branch coverage report using Jest coverage across all engine and UI modules, analyzing branches and coverage thresholds. | Branch coverage report completed in `docs/Branch_Coverage_Report_Team13.docx` (or `.md`). |

Notes per story:

- **S3-01.** A conflict whose merged text was changed by hand gets the status `manual`, with a visible badge. It counts as resolved for the counter. This depends on the decision made in S2-05.
- **S3-02.** Audit every place user text reaches the page. `renderSideBySide` already escapes through `escapeHtml`; the conflict list, file names in the load notes and any new UI must do the same. Add tests with payloads such as `<script>`, `<img onerror=...>` and `"><svg onload=...>`, and check in a browser that nothing runs.
- **S3-03.** Measure first. Keep a benchmark test (two different 2,000-line files in 2 s or less) and also check that rendering a large diff does not freeze the page. Consider rendering rows in chunks if the table is slow.
- **S3-04.** Show unresolved conflicts in the merged text as
  ```
  <<<<<<< A
  (A lines)
  =======
  (B lines)
  >>>>>>> B
  ```
  and remove the markers as each conflict is resolved. Take care that S3-07 treats leftover markers as unresolved.
- **S3-05.** Everything reachable and operable with the keyboard, visible focus, labels on all controls, colour contrast at WCAG AA or better in both light and dark mode, and no information carried by colour alone (the diff already uses `+`, `-`, `~` markers). Run an automated audit such as axe or Lighthouse and record the result.
- **S3-06.** Test in the four browsers, note any differences in the pull request, and fix them. Avoid APIs that are not available in all four.
- **S3-07.** The Apply Merge button is disabled while any conflict is open or markers remain, and explains why (for example, "2 conflicts left"). It enables as soon as the last one is resolved.
- **S3-08.** Two buttons, Download and Copy. The text must match the Merged Result exactly, including line endings and a trailing newline. Copy should report success or failure.
- **S3-09.** One end-to-end test of the whole flow (load two versions, compare, resolve every conflict, apply, download) and an updated traceability matrix in `docs/` linking requirements in the SRS to stories and tests.
- **S3-10.** A written demo script, screenshots, and a deployed copy of the app, for example on GitHub Pages through a `deploy.yml` workflow. Pages needs to be enabled in the repository settings by the owner. The demo should walk through all three sample scenarios.

## 8. Dependencies between stories

- S2-01 comes first: S2-02, S2-03, S2-04, S2-07 and S2-09 all need the conflict model.
- S2-04 and S2-05 share the resolution state and the merged-text builder. Agree on its shape early.
- S2-08 (undo) needs the resolution state to be a single value that can be snapshotted.
- S2-10 needs S2-01 to S2-09 to exist.
- S3-01 needs S2-05. S3-04 and S3-07 need S2-04 and S2-05. S3-08 needs S3-07. S3-09 needs most of Sprint 3.
- S3-10 should be done last, once the app is stable.

## 9. Open decisions

Resolve these early and record the answer in the relevant pull request.

1. How hand edits in the Merged Result pane map back to a conflict's status (S2-05, S3-01).
2. DOM test approach: `jest-environment-jsdom` or Playwright (S2-10).
3. Where the conflict model and resolution state live, and whether they are plain objects or small classes (S2-01, S2-04).
4. Whether the diff view and the Merged Result pane should scroll together (S2-07).
5. How the app is deployed for the demo, and who enables Pages (S3-10).

## 10. Stories by person

Each list covers all three sprints, after the reassignment of S2-09 and S3-08 to Person A. Tick a story off when its issue is closed.

### Person A: Saurav S (`sauravs2006-max`), engine and core logic, 35 points

- [x] Sprint 1: S1-06 Line-by-line diff (#6, 5)
- [x] Sprint 1: S1-07 Unit tests for the diff (#7, 3)
- [x] Sprint 1: S1-10 Compare button (#10, 3)
- [ ] Sprint 2: S2-01 Conflict detection (#11, 5)
- [ ] Sprint 2: S2-02 Live conflict counter (#12, 2)
- [ ] Sprint 2: S2-03 Tests for conflicts and counter (#13, 3)
- [ ] Sprint 2: S2-09 Conflict list with status (#19, 3)
- [ ] Sprint 3: S3-01 Manual-edit status (#21, 3)
- [ ] Sprint 3: S3-02 Safe rendering of pasted code (#22, 3)
- [ ] Sprint 3: S3-03 Performance on big files (#23, 2)
- [ ] Sprint 3: S3-08 Download and copy merged file (#28, 3)

### Person B: Madan P (`madan-p-debug`), input handling, editing, accessibility and demo, 33 points

- [ ] Sprint 1: S1-03 Two editable code panes (#3, 3)
- [ ] Sprint 1: S1-04 Load a version from a file (#4, 3)
- [ ] Sprint 1: S1-05 Reject bad uploads (#5, 2)
- [ ] Sprint 2: S2-04 Accept A, B and Both buttons (#14, 5)
- [ ] Sprint 2: S2-05 Editable Merged Result pane (#15, 5)
- [ ] Sprint 2: S2-06 Tests for untouched input panes (#16, 2)
- [ ] Sprint 2: S2-11 Fix S1-05 upload checks, bug fix (new issue, 2)
- [ ] Sprint 3: S3-04 Git-style conflict markers (#24, 3)
- [ ] Sprint 3: S3-05 Keyboard access and contrast (#25, 3)
- [ ] Sprint 3: S3-06 Cross-browser support (#26, 2)
- [ ] Sprint 3: S3-10 Demo script, screenshots and live demo (#30, 3)

### Person C: Kishan K (`Kishanks43`), UI flow, navigation, undo and integration, 29 points

- [x] Sprint 1: S1-01 Repo skeleton and README (#1, 2)
- [x] Sprint 1: S1-02 CI on every pull request (#2, 3)
- [x] Sprint 1: S1-08 Side-by-side view with highlights (#8, 5)
- [x] Sprint 1: S1-09 Sample scenarios (#9, 2)
- [ ] Sprint 2: S2-07 Next and previous conflict navigation (#17, 3)
- [ ] Sprint 2: S2-08 Undo and redo (#18, 5)
- [x] Sprint 2: S2-10 Integration tests for resolve flow (#20, 3)
- [ ] Sprint 3: S3-07 Apply Merge guard (#27, 3)
- [ ] Sprint 3: S3-09 End-to-end test and traceability matrix (#29, 3)
- [ ] Sprint 3 Testing: T-04 System Validation Report
- [ ] Sprint 3 Testing: T-05 Branch Coverage Report

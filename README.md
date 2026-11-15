# Web-Based Code Merge Simulator (Team 13)

A browser tool for practising merge-conflict resolution. Paste or load two versions of a file, see
the differences side by side, resolve each conflict (Accept A, Accept B, Accept Both, or edit by
hand), and download or copy the merged result. Everything runs in the browser; no code leaves it.

Plain JavaScript (ES modules), no framework or build step. Tested with Jest, linted with ESLint.

## Run it

```bash
npm install
npm start
```

Then open `http://localhost:8080`.

## Test it

```bash
npm test        # 397 tests
npm run lint
```

GitHub Actions runs `npm test` on every pull request (Node 20).

## Features

- Two input panes with line counts, **Load file** (text files up to 2 MB; binary files refused) and three **built-in samples**
- **Side-by-side diff** with `~ + -` markers and a summary line
- **Conflict list** with a live counter, **Previous / Next** buttons and the `[` `]` keys
- **Accept A / Accept B / Accept Both** per conflict, with **Undo / Redo** (buttons, Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- Editable **Merged Result** with `<<<<<<<` / `=======` / `>>>>>>>` markers for open conflicts; a hand edit marks the conflict **Manual**
- **Apply Merge**, enabled only when every conflict is resolved
- **Download** (`merged-result.txt`) and **Copy** of the merged result
- Pasted code is always shown as plain text, with a Content Security Policy on the page

## Project layout

```
index.html            the page
src/app.js            wires the page to the engine
src/engine/           diff, conflicts, resolutions, session, history, merge, manual edits, merge guard
src/ui/               diff view, conflict list, counter, navigation, shortcuts, download/copy, styles
src/fileLoader.js     file loading and upload checks
src/samples.js        built-in samples
tests/                Jest tests (one file per module, plus page and end-to-end tests)
docs/                 project documents and reports
```

## Documents

| Document | File |
|---|---|
| Software Requirements Specification | [`docs/SRS_Team13.docx`](docs/SRS_Team13.docx) |
| Software Architecture and Design | [`docs/SAD_Team13_arch.docx`](docs/SAD_Team13_arch.docx) |
| Test Plan | [`docs/Test_Plan_Team13.docx`](docs/Test_Plan_Team13.docx) |
| Test Case Document | [`docs/Test_Case_Document_Team13.docx`](docs/Test_Case_Document_Team13.docx) |
| Unit Test Report | [`docs/Unit_Test_Report_Team13.docx`](docs/Unit_Test_Report_Team13.docx) |
| Code Coverage Report | [`docs/Code_Coverage_Report_Team13.docx`](docs/Code_Coverage_Report_Team13.docx) |
| Branch Coverage Report | [`docs/Branch_Coverage_Report_Team13.docx`](docs/Branch_Coverage_Report_Team13.docx) |
| System Validation Report | [`docs/System_Validation_Report_Team13.docx`](docs/System_Validation_Report_Team13.docx) |
| Requirements Traceability Matrix | [`docs/Requirements_Traceability_Matrix_Team13.md`](docs/Requirements_Traceability_Matrix_Team13.md) |
| Deviations from SRS and SAD | [`docs/Deviations_Team13.docx`](docs/Deviations_Team13.docx) |
| Demo script | [`docs/DEMO-SCRIPT-S3-10.md`](docs/DEMO-SCRIPT-S3-10.md) |

## Known issues

- Typing inside an open conflict block in the Merged Result moves the cursor to the end of the text (B-01, #91).
- CI runs the tests but not ESLint (B-04, #94).

See the deviations document for requirements that were not built or were built differently.

## Team

Kishan Kabadi S, Madan P, Saurav Shashidhara

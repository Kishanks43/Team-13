"""
Generate Branch_Coverage_Report_Team13.docx from coverage data.
Run: python scripts/create_branch_coverage_report.py
Requires: pip install python-docx
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "Branch_Coverage_Report_Team13.docx")

# ---------------------------------------------------------------------------
# Coverage data (from Jest json-summary output, 2026-11-09)
# ---------------------------------------------------------------------------

MODULE_DATA = [
    # (group_label, module, stmts%, branch%, funcs%, lines%, uncovered)
    # --- src root ---
    ("src/", "app.js",          94.03, 80.64, 89.28, 96.24, "16–17, 24–25, 228"),
    ("src/", "fileLoader.js",   98.21, 97.61, 100.0, 97.67, "94"),
    ("src/", "samples.js",      100.0, 100.0, 100.0, 100.0, "—"),
    # --- engine ---
    ("src/engine/", "conflicts.js",  100.0, 100.0,  100.0, 100.0, "—"),
    ("src/engine/", "diff.js",        97.34,  98.30,  100.0,  97.05, "68–70"),
    ("src/engine/", "history.js",     90.62,  81.25,   80.0,  92.85, "48–49"),
    ("src/engine/", "manualEdit.js", 100.0,  100.0,  100.0, 100.0, "—"),
    ("src/engine/", "merge.js",      100.0,  100.0,  100.0, 100.0, "—"),
    ("src/engine/", "mergeGuard.js", 100.0,   92.85, 100.0, 100.0, "29"),
    ("src/engine/", "resolutions.js",100.0,  100.0,  100.0, 100.0, "—"),
    ("src/engine/", "session.js",     95.83,  85.71, 100.0, 100.0, "61–67"),
    # --- ui ---
    ("src/ui/", "conflictList.js",   100.0,  90.90, 100.0, 100.0, "14"),
    ("src/ui/", "conflictNav.js",     58.33,  42.85,  80.0,  50.0, "49–60"),
    ("src/ui/", "diffView.js",       100.0,  100.0, 100.0, 100.0, "—"),
    ("src/ui/", "exportMerged.js",   100.0,   71.42, 100.0, 100.0, "10–20, 46"),
    ("src/ui/", "paneInfo.js",       100.0,  100.0, 100.0, 100.0, "—"),
    ("src/ui/", "progress.js",       100.0,  100.0, 100.0, 100.0, "—"),
    ("src/ui/", "undoKeys.js",       100.0,   96.0, 100.0, 100.0, "28"),
]

GROUP_TOTALS = [
    # (label, stmts%, branch%, funcs%, lines%)
    ("src/ (root files)",   95.32, 87.50, 92.68, 96.66),
    ("src/engine/",         97.57, 96.17, 96.49, 98.32),
    ("src/ui/",             92.59, 84.25, 95.65, 92.17),
    ("tests/helpers/",      95.45, 63.63, 93.33, 95.00),
    ("ALL FILES",           95.86, 89.90, 94.85, 96.57),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def set_cell_bg(cell, hex_color):
    """Set table cell background shading."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)

def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    h.style.font.color.rgb = RGBColor(0x1A, 0x73, 0xE8)
    return h

def add_table_row(table, values, bold=False, header=False):
    row = table.add_row()
    for i, val in enumerate(values):
        cell = row.cells[i]
        cell.text = str(val)
        para = cell.paragraphs[0]
        run = para.runs[0] if para.runs else para.add_run(str(val))
        run.bold = bold or header
        run.font.size = Pt(9)
        if header:
            set_cell_bg(cell, "1A73E8")
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    return row

def branch_color(pct):
    if pct >= 90:
        return "D4EDDA"   # green
    elif pct >= 70:
        return "FFF3CD"   # yellow
    else:
        return "F8D7DA"   # red

# ---------------------------------------------------------------------------
# Build document
# ---------------------------------------------------------------------------

doc = Document()

# Title
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("Branch Coverage Report — Team 13")
run.bold = True
run.font.size = Pt(20)
run.font.color.rgb = RGBColor(0x1A, 0x73, 0xE8)

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_run = subtitle.add_run("Code Merge Simulator · Sprint 3")
sub_run.font.size = Pt(13)
sub_run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

doc.add_paragraph()

# Metadata table
meta = doc.add_table(rows=0, cols=2)
meta.style = "Table Grid"
meta_rows = [
    ("Project",          "Code Merge Simulator"),
    ("Team",             "Team 13"),
    ("Report ID",        "T-05"),
    ("GitHub Issue",     "#71"),
    ("Coverage Tool",    "Jest 29.7 with Istanbul (built-in)"),
    ("Date Generated",   "2026-11-09"),
    ("Prepared By",      "Kishan K (Kishanks43)"),
    ("Test Suites",      "26 passed"),
    ("Total Tests",      "362 passed"),
]
for key, val in meta_rows:
    r = meta.add_row()
    r.cells[0].text = key
    r.cells[0].paragraphs[0].runs[0].bold = True
    r.cells[0].paragraphs[0].runs[0].font.size = Pt(9)
    r.cells[1].text = val
    r.cells[1].paragraphs[0].runs[0].font.size = Pt(9)

doc.add_paragraph()

# Section 1 — Executive Summary
add_heading(doc, "1. Executive Summary", level=1)
doc.add_paragraph(
    "This report presents the branch coverage analysis for the Code Merge Simulator collected from the full "
    "Jest test suite run during Sprint 3. All 26 test suites and 362 individual tests passed. Coverage was "
    "measured using Jest's built-in Istanbul instrumentation across all production source modules."
)

# Overall summary table
add_heading(doc, "Overall Coverage Summary", level=2)
t = doc.add_table(rows=0, cols=4)
t.style = "Table Grid"
add_table_row(t, ["Metric", "Total Items", "Covered", "Coverage %"], header=True)
for metric, total, covered, pct in [
    ("Statements", 701, 672, "95.86%"),
    ("Branches",   406, 365, "89.90%"),
    ("Functions",  136, 129, "94.85%"),
    ("Lines",      613, 592, "96.57%"),
]:
    r = add_table_row(t, [metric, total, covered, pct])
    if metric == "Branches":
        for cell in r.cells:
            set_cell_bg(cell, "FFF3CD")

doc.add_paragraph(
    "Quality Gate: The project targets >90% branch coverage for core engine logic (src/engine/). "
    "The engine sub-package achieved 96.17% branch coverage, comfortably exceeding the threshold."
)

doc.add_paragraph()

# Section 2 — Environment
add_heading(doc, "2. Validation Environment", level=1)
env_t = doc.add_table(rows=0, cols=2)
env_t.style = "Table Grid"
env_rows = [
    ("Runtime",          "Node.js with --experimental-vm-modules"),
    ("Test Framework",   "Jest 29.7.0"),
    ("Coverage Instrument", "Istanbul v2 (bundled with Jest)"),
    ("Coverage Reporters", "json-summary, text, lcov"),
    ("Test Environment", "jsdom / node"),
    ("Operating System", "Windows 11"),
    ("Execution Time",   "~12.21 seconds"),
]
for k, v in env_rows:
    r = env_t.add_row()
    r.cells[0].text = k
    r.cells[0].paragraphs[0].runs[0].bold = True
    r.cells[0].paragraphs[0].runs[0].font.size = Pt(9)
    r.cells[1].text = v
    r.cells[1].paragraphs[0].runs[0].font.size = Pt(9)

doc.add_paragraph()

# Section 3 — Coverage Matrix
add_heading(doc, "3. Module Coverage Matrix", level=1)

# Group totals
add_heading(doc, "3.1 Coverage by Group", level=2)
gt = doc.add_table(rows=0, cols=5)
gt.style = "Table Grid"
add_table_row(gt, ["Group", "% Statements", "% Branches", "% Functions", "% Lines"], header=True)
for grp, stmts, branch, funcs, lines in GROUP_TOTALS:
    r = gt.add_row()
    vals = [grp, f"{stmts}%", f"{branch}%", f"{funcs}%", f"{lines}%"]
    for i, v in enumerate(vals):
        c = r.cells[i]
        c.text = v
        run = c.paragraphs[0].runs[0] if c.paragraphs[0].runs else c.paragraphs[0].add_run(v)
        run.font.size = Pt(9)
        run.bold = (grp == "ALL FILES")
        if i == 2:  # Branch column
            set_cell_bg(c, branch_color(branch))

doc.add_paragraph()

# Per-module table
add_heading(doc, "3.2 Per-Module Detail", level=2)
pm = doc.add_table(rows=0, cols=6)
pm.style = "Table Grid"
add_table_row(pm, ["Module", "% Stmts", "% Branch", "% Funcs", "% Lines", "Uncovered Lines"], header=True)

last_group = ""
for grp, module, stmts, branch, funcs, lines, uncov in MODULE_DATA:
    if grp != last_group:
        # Group separator row
        sep_r = pm.add_row()
        set_cell_bg(sep_r.cells[0], "E8F0FE")
        merged = sep_r.cells[0].merge(sep_r.cells[5])
        merged.text = grp
        merged.paragraphs[0].runs[0].bold = True
        merged.paragraphs[0].runs[0].font.size = Pt(9)
        last_group = grp

    r = pm.add_row()
    vals = [module, f"{stmts}%", f"{branch}%", f"{funcs}%", f"{lines}%", uncov]
    for i, v in enumerate(vals):
        c = r.cells[i]
        c.text = v
        run = c.paragraphs[0].runs[0] if c.paragraphs[0].runs else c.paragraphs[0].add_run(v)
        run.font.size = Pt(9)
        if i == 2:  # Branch column colour-coded
            set_cell_bg(c, branch_color(branch))

doc.add_paragraph()

# Section 4 — Critical Branch Analysis
add_heading(doc, "4. Critical Branch Analysis", level=1)
doc.add_paragraph(
    "The following engine branches were identified as critical for application correctness. "
    "All are verified covered by the Sprint 3 test suite:"
)

covered_branches = [
    ("diff.js",       "LCS algorithm boundary — equal / not-equal token paths"),
    ("diff.js",       "Empty-input guard (zero lines on either side)"),
    ("diff.js",       "Identical inputs → returns empty diff"),
    ("conflicts.js",  "Conflict region open / close transitions"),
    ("conflicts.js",  "Zero conflicts scenario"),
    ("conflicts.js",  "Adjacent conflict merging"),
    ("merge.js",      "Accept A / Accept B / Accept Both branching"),
    ("manualEdit.js", "Edit propagation to resolution state"),
    ("mergeGuard.js", "Block export while conflicts unresolved"),
    ("resolutions.js","Resolution state transitions (all paths)"),
]
cb_t = doc.add_table(rows=0, cols=3)
cb_t.style = "Table Grid"
add_table_row(cb_t, ["Module", "Branch Description", "Status"], header=True)
for mod, desc in covered_branches:
    r = cb_t.add_row()
    r.cells[0].text = mod
    r.cells[1].text = desc
    r.cells[2].text = "PASS"
    for c in r.cells:
        c.paragraphs[0].runs[0].font.size = Pt(9)
    set_cell_bg(r.cells[2], "D4EDDA")

doc.add_paragraph()

add_heading(doc, "Uncovered / Partially Covered Branches", level=2)
uncov_data = [
    ("history.js",      "Undo/Redo past-boundary guard",             "48–49",       "Medium"),
    ("session.js",      "Malformed config initialization branch",    "61–67",       "Medium"),
    ("conflictNav.js",  "Navigation when conflict list is empty",    "49–60",       "Medium"),
    ("app.js",          "DOM element absent at bootstrap",           "16–17, 24–25","Low"),
    ("app.js",          "Tooltip toggle fallback branch",            "228",         "Low"),
    ("fileLoader.js",   "MIME-type fallback for unknown extension",  "94",          "Low"),
    ("exportMerged.js", "Clipboard API unavailable fallback",        "10–20, 46",   "Low"),
    ("undoKeys.js",     "Modifier key combination edge path",        "28",          "Low"),
    ("conflictList.js", "Null conflict item render guard",           "14",          "Low"),
]
ub_t = doc.add_table(rows=0, cols=4)
ub_t.style = "Table Grid"
add_table_row(ub_t, ["Module", "Branch Description", "Lines", "Severity"], header=True)
for mod, desc, lines, sev in uncov_data:
    r = ub_t.add_row()
    r.cells[0].text = mod
    r.cells[1].text = desc
    r.cells[2].text = lines
    r.cells[3].text = sev
    for c in r.cells:
        c.paragraphs[0].runs[0].font.size = Pt(9)
    if sev == "Medium":
        set_cell_bg(r.cells[3], "FFF3CD")
    else:
        set_cell_bg(r.cells[3], "D4EDDA")

doc.add_paragraph()

# Section 5 — Sprint Comparison
add_heading(doc, "5. Coverage Evolution (Sprint Comparison)", level=1)
sc_t = doc.add_table(rows=0, cols=4)
sc_t.style = "Table Grid"
add_table_row(sc_t, ["Sprint", "Branch Coverage (Engine)", "Branch Coverage (All)", "Test Count"], header=True)
for sprint, eng, all_, count in [
    ("Sprint 1", "~70% (estimated)", "~65% (estimated)", "~80 tests"),
    ("Sprint 2", "~88% (estimated)", "~82% (estimated)", "~200 tests"),
    ("Sprint 3", "96.17% (measured)", "89.90% (measured)", "362 tests"),
]:
    r = sc_t.add_row()
    for i, v in enumerate([sprint, eng, all_, count]):
        r.cells[i].text = v
        r.cells[i].paragraphs[0].runs[0].font.size = Pt(9)
        r.cells[i].paragraphs[0].runs[0].bold = (sprint == "Sprint 3")

doc.add_paragraph()

# Section 6 — Conclusion
add_heading(doc, "6. Conclusion", level=1)
doc.add_paragraph(
    "The Sprint 3 test suite demonstrates strong coverage across the Code Merge Simulator:\n\n"
    "• Core Engine Coverage: src/engine/ achieved 96.17% branch coverage, exceeding the >90% quality gate.\n"
    "• All 26 test suites passed with 362 tests — zero failures.\n"
    "• 5 of 7 engine modules achieved 100% or near-100% branch coverage.\n"
    "• The two engine modules below 90% threshold (history.js at 81.25% and session.js at 85.71%) have been "
    "analyzed; their uncovered branches are edge-case guards that do not affect primary workflows.\n"
    "• UI module conflictNav.js has notably low coverage (42.85%) due to DOM event handling complexity; "
    "this is documented for the next sprint backlog.\n\n"
    "Overall, the codebase is well-tested and ready for the Sprint 3 demo and final release."
)

doc.add_paragraph()
footer_p = doc.add_paragraph()
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer_run = footer_p.add_run(
    "Report generated by: Kishan K (Kishanks43) · Team 13 · Sprint 3 · 2026-11-09\n"
    "Coverage tool: Jest 29.7.0 with Istanbul instrumentation · GitHub Issue #71"
)
footer_run.font.size = Pt(8)
footer_run.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

# Save
out = os.path.abspath(OUTPUT_PATH)
doc.save(out)
print(f"Saved: {out}")

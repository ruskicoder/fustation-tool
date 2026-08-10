# Current Progress — fustation-tool

**Last Updated**: 2026-08-07
**Status**: 🟢 **ALL ACTIVE ISSUES RESOLVED (ISSUE-80 FE PDF EXPORT ROUTING & NUMERIC ID GUARD COMPLETE & VERIFIED)**

---

## Key Milestone Completed: ISSUE-80 FE PDF Export Routing & Alphanumeric `pdfUrl` Prevention

### What Was Fixed
1. **Strict Numeric Product ID Guard (`src/utils/parser.ts` & `src/utils/exporter.ts` — ISSUE-80)**:
   - Restricted `/api/exams/pdf?productId=${numId}` URL resolution in `parser.ts` to valid 5–8 digit numeric IDs (`/^\d{5,8}$/`).
   - Prevented alphanumeric CUIDs (`cmo728mwf000004kypj5r0dug`) from being populated into `pdfUrl` on FE exams.

2. **Refined Exporter Classifier (`src/utils/exporter.ts` — ISSUE-80)**:
   - Added centralized `isPeDataset(dataset)` helper that returns `true` ONLY for genuine PE datasets (category `PE`, 0 questions, examType containing `PE`, or valid PE zip/pdf asset links).
   - Ensured FE exams (`examCategory === 'FE'` with 30 questions) strictly route to self-contained HTML print PDF generation.

3. **Popup Blocker Fallback (`src/utils/exporter.ts` — ISSUE-80)**:
   - Added fallback downloading of the self-contained `.html` print document (`downloadBlob`) if `window.open` returns `null` due to browser popup restrictions during `exportExam(dataset, 'PDF')`.

---

## Previous Milestone Completed: Issues 77, 78, & 79 Math Parsing & Entity Highlighting

### What Was Fixed
1. **Escaped Currency Pre-Conversion (`src/utils/math.ts` — ISSUE-77 & ISSUE-79)**:
   - Added `\uE000` sentinel token masking for escaped currency dollar signs (`\$1`, `\$2`, `\$3`) in `sanitizeMathLatex` BEFORE running math delimiter splitting.
   - Restored `\uE000` to literal `$` for UI display and `\$` for Markdown exports.

2. **Entity-Aware Search Query Highlighting (`src/utils/highlight.ts` — ISSUE-78)**:
   - Updated `highlightText` to split text on HTML entity boundaries, preventing search query matching from breaking HTML entities like `&#36;`.

---

## Verification & Build Results
- Clean TypeScript compilation via `tsc`.
- Production Vite build bundled into `/dist`.
- All 8 integration test suites passed 100% cleanly.

# Current Progress — fustation-tool

**Last Updated**: 2026-08-12
**Status**: 🟢 **ALL ACTIVE ISSUES RESOLVED (ISSUES 93–95 ZERO-TRUST LOG ANALYSIS: S3 PROXY REWRITING, PRODUCT ID CLEANUP & LIVE ZIP RE-EXTRACTION VERIFIED)**

---

## Key Milestone Completed: Issues 93–95 Zero-Trust Log Analysis & Root Cause Resolutions

### What Was Fixed
1. **Direct AWS S3 Presigned URL Proxy Rewriting (`src/utils/images.ts` — ISSUE-93)**:
   - Updated `normalizeImageUrl` to detect direct S3 presigned URLs (`https://fustation.s3.ap-southeast-1.amazonaws.com/...`) and rewrite them to the authenticated proxy endpoint `${FUSTATION_ORIGIN}/api/exams/question-image?key=${cleanKey}`.
   - Eliminates the 694 instances of **HTTP 403 Forbidden** recorded in `failedlogs.txt`.

2. **Removal of Title Suffix Product ID Fallback (`src/utils/exporter.ts` — ISSUE-94)**:
   - Removed 6-digit title suffix matching (`HCM202_SU26_RE_808009` -> `808009`) in `extractNumericProductId` and `resolveValidPdfUrl`.
   - Eliminates the 144 instances of **HTTP 404 Not Found** caused by querying non-existent `productId=808009` endpoints.

3. **Live PE ZIP Presigned Link Re-extraction (`src/utils/exporter.ts` — ISSUE-95)**:
   - Updated `downloadZipAsset` and `exportSinglePe` to re-query live page DOM anchors (`extractPeZipUrl(document.documentElement.innerHTML, true)`) to obtain fresh presigned URLs before attempting download.

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

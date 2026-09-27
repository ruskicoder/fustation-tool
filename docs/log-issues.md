# Comprehensive Log of Issues & Platform Architectural Findings: `fustation-tool`

> **Document Status**: Live Technical Audit & Issues Register  
> **Target System**: `fustation-tool` Chromium Browser Extension (Manifest V3, React 18, TypeScript, Vite)  
> **Target Web Platform**: `fustation.net` (Next.js App Router, RSC Stream Engine)

---

## Executive Summary

This document maintains open, deferred, and roadmap issues identified during testing and user feedback. Implemented and verified issues are purged upon successful build verification.

---

## I. Resolved Issues Log (Purged)

- [x] **ISSUE-01**: Fragile RSC Chunk JSON Extraction (`unescapeNextFChunk`) -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-02**: Hardcoded DOM Crawler Selectors (`crawlExamFromDOM`) -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-03**: Next.js `$D` ISO Date Prefix & Date Formatting -> Fixed via `sanitizeRscDate()`.
- [x] **ISSUE-04**: Raw HTML Entity & Double-Escaped Quote Pollution -> Fixed via `decodeHtmlEntities()`.
- [x] **ISSUE-05**: `ExamDataset` Schema Incompleteness -> Fixed in `src/types/index.ts`.
- [x] **ISSUE-06**: Naive Exam Code Parsing (`title.split('_')[0]`) -> Fixed via `parseExamCode()`.
- [x] **ISSUE-08**: Panel Dimensions & Layout Shift Prevention -> Fixed in `src/styles/overlay.css`.
- [x] **ISSUE-09**: Separate "Save" vs "Download" Business Logic -> Fixed in `src/components/ExtractTab.tsx`.
- [x] **ISSUE-10**: Saved Tab Sticky Toolbar & Danger Action -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-11**: Storage Cache Schema Backward-Compatibility -> Fixed via `normalizeSavedDataset()` in `src/utils/storage.ts`.
- [x] **ISSUE-13**: ExtractTab ExamSet Badges / 5-Row Metadata Layout -> Fixed in `src/components/ExtractTab.tsx`.
- [x] **ISSUE-14**: SavedTab Per-Item `[Delete][Download]` Action Buttons -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-15**: Redundant Header Controls (Single Minimize button) -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-16**: In-Extension Saved ExamSet Viewing / Preview Mode -> Fixed in `src/components/ViewerPanel.tsx`.
- [x] **ISSUE-17**: `unescapeNextFChunk` Raw Control Character (`\n`) JSON Parse Crash -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-18**: Cascade Fallback & Dummy Default Placeholders -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-19**: Live Script Extraction String Match Failure -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-20**: DOM Crawler Text Answer Reveal & Partial Fetch UI -> Fixed in `src/utils/parser.ts`, `src/components/ExtractTab.tsx`.
- [x] **ISSUE-21**: SPA Route Navigation & Auto-Save -> Fixed in `manifest.json`, `src/background.ts`, `src/components/Overlay.tsx`.
- [x] **ISSUE-22**: Manual Save Resilience & Unlimited Storage -> Fixed in `src/utils/storage.ts`, `manifest.json`.
- [x] **ISSUE-23**: Exported Filename Deduplication -> Fixed in `src/utils/exporter.ts`.
- [x] **ISSUE-24**: SavedTab Partial Fetch Badge Indicator -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-25**: Metadata Header Term & ExamType Precedence -> Fixed across types, parser, compiler, exporter.
- [x] **ISSUE-28**: DOM Crawler Navigation & State Synchronization Failure -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-29**: Instant RSC Script Manual Fetch -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-30**: Session Time Metadata Extraction & Fallback -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-31**: Extension Reload Proofing & Fetch State Resilience -> Fixed in `src/utils/storage.ts`, `src/components/Overlay.tsx`.
- [x] **ISSUE-32**: Persistent Panel State & Auto-Open Persistence -> Fixed in `src/utils/storage.ts`, `src/components/Overlay.tsx`.
- [x] **ISSUE-33**: SavedTab Outline View & Subject Folder Hierarchy -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-34**: Enhanced Folder & Record Row Badges -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-35**: Global Format Switcher Relocation -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-36**: ExtractTab Panel Restructuring & Sticky Toolbar -> Fixed in `src/components/ExtractTab.tsx`, `SavedTab.tsx`.
- [x] **ISSUE-37**: Panel Geometry Integration & Handlers -> Fixed in `src/components/Overlay.tsx`, `usePanelGeometry.ts`.
- [x] **ISSUE-38**: Dynamic Theme Switching -> Fixed in `src/components/Overlay.tsx`, `src/utils/storage.ts`.
- [x] **ISSUE-39**: Transient Toast Notification Queue -> Fixed in `useToasts.ts`, `ToastHost.tsx`.
- [x] **ISSUE-40**: Skeleton Shimmer Loading Feedback -> Fixed in `Skeleton.tsx`.
- [x] **ISSUE-41**: Icon Dictionary Consolidation -> Fixed in `Icons.tsx`.
- [x] **ISSUE-42**: Unified 4-Phase RSC Pipeline (isManual Guard Fix) -> Fixed in `src/components/Overlay.tsx`, `src/utils/storage.ts`.
- [x] **ISSUE-43**: DOM Crawler Deprecation & Fallback Isolation -> Fixed in `src/utils/parser.ts`, `src/components/Overlay.tsx`.
- [x] **ISSUE-44**: RSC Payload Streaming Retry Loop (300ms x10) -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-45**: `runFetch` Stale Closure Ref Pattern (`runFetchRef`) -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-46**: `tryParsePartialJson` Quote Escape Handling (`isEscapedQuote`) -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-48**: KaTeX Math Typesetting Engine & RSC Entity Unescaping -> Fixed in `src/utils/math.ts`, `src/components/MathText.tsx`, `src/components/QuestionCard.tsx`.
- [x] **ISSUE-49**: Relative Image Path Normalization & Base64 Self-Contained Exports -> Fixed in `src/utils/images.ts`, `src/utils/compiler.ts`, `src/utils/exporter.ts`.
- [x] **ISSUE-50 / Sub-Issue**: Pure React Lightbox Portal & Event Propagation Lock -> Fixed in `src/components/ImageLightbox.tsx`, `src/components/QuestionCard.tsx`, `src/styles/overlay.css`.
- [x] **ISSUE-51**: Blob Image API Proxy Routing Failure -> Fixed in `src/utils/images.ts`.
- [x] **ISSUE-53**: PE Examset Identification, Full-Height PDF Preview & Dynamic Format Switcher Matrix -> Fixed in `src/utils/parser.ts`, `src/components/ViewerPanel.tsx`, `src/components/FormatSwitcher.tsx`, `src/components/Overlay.tsx`.
- [x] **ISSUE-54**: Bulk Download Folder-Structured Zipping via JSZip (`fustation_export_ddmmyyyy.zip`) -> Fixed in `src/utils/exporter.ts`, `src/components/SavedTab.tsx`, `src/components/Overlay.tsx`.
- [x] **ISSUE-55**: PE Examset Fetch Success Condition Bug in Overlay RSC Pipeline -> Fixed via `isValidExtractedDataset()` in `src/components/Overlay.tsx`.
- [x] **ISSUE-58**: PE PDF Paper / Asset Embedded Viewer 20% Width Layout Constraint -> Fixed via `pe-mode` 1fr override in `src/styles/overlay.css` and `src/components/ViewerPanel.tsx`.
- [x] **ISSUE-59**: Storage Cache Normalization Strips `examCategory`, `pdfUrl`, and `zipUrl` -> Fixed via `normalizeSavedDataset()` and `saveExamToStorage()` in `src/utils/storage.ts`.
- [x] **ISSUE-60**: PE Title Token Precedence & Exporter Guard Bypass -> Fixed in `src/utils/parser.ts`, `src/utils/exporter.ts`, `src/utils/images.ts`.
- [x] **ISSUE-61**: Missing `"downloads"` Permission & Synthetic Anchor Download Block -> Fixed in `manifest.json`, `src/utils/exporter.ts`.
- [x] **ISSUE-62**: `exportSinglePe` Zip Fetch Failure & Unchecked Success Toast -> Fixed in `src/utils/exporter.ts`, `src/components/Overlay.tsx`.
- [x] **ISSUE-63**: PE PDF Viewer Search Input Causes Continuous Iframe Reloads -> Fixed via debounced search state in `src/components/ViewerPanel.tsx`.
- [x] **ISSUE-64**: Lack of Metadata Details Inspector Modal/Tooltip in SavedTab -> Fixed via Info button `[i]` and inspector modal in `src/components/SavedTab.tsx`.
- [x] **ISSUE-64 / Hotfix**: Metadata Inspector Modal Transparency & PE Asset Link Resolution -> Fixed in `src/styles/overlay.css`, `src/components/SavedTab.tsx`.
- [x] **ISSUE-66**: PE ZIP Material Extraction Failure & S3 Presigned URL `\u0026` Unescaping -> Fixed in `src/utils/parser.ts`, `src/utils/exporter.ts`, `src/utils/storage.ts`.
- [x] **ISSUE-68**: Duplicate "PE" Badges in `SavedTab.tsx` Child Record Rows -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-69**: Search Query Filtered Folder Action Scope Discrepancy -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-70**: `extractPeZipUrl` Fails on Presigned S3 URLs without `.zip` Path -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-71**: `ViewerPanel` PDF Iframe 404 Error on Non-Numeric `dataset.id` -> Fixed in `src/components/ViewerPanel.tsx`.
- [x] **ISSUE-72**: `chrome.storage.local` Concurrency Write Overwriting in Batch Fetcher -> Fixed in `src/utils/storage.ts`.
- [x] **ISSUE-73**: Incomplete Session Metadata in `generatePrintHtml` Cover Header -> Fixed in `src/utils/exporter.ts`.
- [x] **ISSUE-74**: `exportBulkAsZip` Skipping PDF Assets when `pdfUrl` is Null -> Fixed in `src/utils/exporter.ts`.
- [x] **ISSUE-75**: `FormatSwitcher` Mixed-Mode Label Overflow on 380px Panel Width -> Fixed in `src/components/FormatSwitcher.tsx`, `src/styles/overlay.css`.
- [x] **ISSUE-77**: Escaped Currency Dollar Signs (`\$`) Treated as Math Delimiters (`$`) -> Fixed in `src/utils/math.ts` via `\uE000` sentinel token masking.
- [x] **ISSUE-78**: Math Search Query Highlighting HTML Entity Protection -> Fixed in `src/utils/highlight.ts` via entity-aware segment splitting.
- [x] **ISSUE-79**: `sanitizeMathLatex` Pre-Conversion to `&#36;` Double-Escaped into `&amp;#36;` -> Fixed in `src/utils/math.ts` via `\uE000` sentinel token masking & literal `$` restoration.
- [x] **ISSUE-80**: Invalid Alphanumeric `pdfUrl` Construction & False `isPe` Export Routing -> Fixed in `src/utils/parser.ts` & `src/utils/exporter.ts`.
- [x] **ISSUE-81**: Stripped CSS Styles & Missing KaTeX Stylesheet in `generatePrintHtml` -> Fixed in `src/utils/exporter.ts`.
- [x] **ISSUE-82**: Bulk Batch Export Failure & Expired S3 Presigned URLs (HTTP 403) -> Fixed in `src/utils/exporter.ts` via dynamic `/marketplace/exam/${cuid}?_rsc=1` query refresh engine and `fetchArrayBufferWithFastRetry`.
- [x] **ISSUE-83**: UI/UX Restoration (Slide-Up ProgressFooter, Expandable Log Drawer, Compact 2-Row Format Matrix Switcher) -> Restored in `src/components/ProgressFooter.tsx`, `FormatSwitcher.tsx`, `Overlay.tsx`, `ExtractTab.tsx`, `SavedTab.tsx`, and `src/styles/overlay.css`.
- [x] **ISSUE-84**: `/marketplace/{id}` Route & Fetch Failure -> Fixed across `src/utils/parser.ts`, `src/components/Overlay.tsx`, `src/background.ts`, `src/utils/batchFetcher.ts`, and `src/utils/exporter.ts` via unified dual-route non-capturing regex with static asset layout guards.
- [x] **ISSUE-85**: Shipped `src/manifest.json` lacked `webNavigation`; stale root `manifest.json` held the fix -> Added `webNavigation` to `src/manifest.json`, deleted root `manifest.json`.
- [x] **ISSUE-86**: `chrome.downloads` branch unreachable from the content script -> Removed from `downloadAssetUrl` in `src/utils/exporter.ts`; anchor fallback kept.
- [x] **ISSUE-87**: Five duplicated, over-broad exam-id regexes -> Single CUID-shaped matcher in `src/utils/examId.ts`, used by `parser.ts`, `Overlay.tsx`, `batchFetcher.ts`.
- [x] **ISSUE-88**: Orphan `fustation_catalog` key -> Writer removed from `src/background.ts` (worker now only forwards SPA navigation).
- [x] **ISSUE-89**: Test suite untracked in `scratch/` -> Moved to `tests/test-flow.ts`; `package.json` and `scripts/build.js` updated.
- [x] **ISSUE-90**: Currency dollars (`$20000 ... $1500`) paired as inline math, typesetting prose as a formula -> Pandoc-style delimiter normalization in `sanitizeMathLatex` (`src/utils/math.ts`).
- [x] **ISSUE-91**: Malformed `$$x$` options (MAE101) rendered a stray `$` -> Repaired to inline math by the same normalizer.
- [x] **ISSUE-92**: Markdown export dropped `<Integer>` generics, collapsed code indentation, and merged options into one paragraph -> `src/utils/compiler.ts` fences code bodies verbatim, escapes `<` outside math, hard-breaks options and multi-line text.
- [x] **ISSUE-93**: Bulk ZIP silently overwrote same-titled exams in one subject folder -> Per-volume unique names (`_2`, `_3`) in `exportBulkAsZip`.
- [x] **ISSUE-94**: Bulk manifest omitted PE assets whose URL could not be resolved -> Recorded as `Missing` with a log line.
- [x] **ISSUE-95**: Exported print HTML linked KaTeX 0.16.11 CSS from a CDN while rendering with 0.18.1, duplicating every formula when opened offline; title and metadata were not HTML-escaped -> MathML-only output for exports (`renderMathInText(..., 'mathml')`), escaped header fields.
- [x] **ISSUE-96**: Exports fabricated metadata defaults (`SP26`, `29/04/2026`, `XAVALO`) -> `N/A` in `compileMarkdown` and `generatePrintHtml`.
- [x] **ISSUE-97**: `½`, `€`, `₫` rewritten to LaTeX in plain text, printing `\frac{1}{2}` literally -> Substitution limited to math segments.
- [x] **ISSUE-99**: Reading passages of language exams (`initialData.readingPassages[{text, fromQuestion, toQuestion}]`) were dropped, leaving "according to the passage" questions without a passage -> `ExamDataset.passages` in `src/types/index.ts`, parsed in `formatExamDataset`, rendered before the first question of its range in Markdown, print HTML and the viewer (`QuestionList.tsx`).
- [x] **ISSUE-100**: RSC serializes missing values as the string `"$undefined"`; every language-exam question got `imageUrl: "$undefined"`, exported and displayed as a broken `https://www.fustation.net/$undefined` image -> `rscString` in `parser.ts`, plus a guard in `normalizeImageUrl` for already-saved datasets.
- [x] **ISSUE-101**: On an SPA-navigated exam page (no inline payload), `extractPeFromDOM` matched `/PE/` anywhere and returned an asset-less "PE" dataset, and `isValidExtractedDataset` accepted any PE, so Reading exams were saved as empty PE sets and the reload recovery never ran -> PE DOM fallback requires a real PDF or ZIP asset; validation requires questions or an asset.
- [x] **ISSUE-102**: The RSC text-row resolver read `<id>:T<len>,` lengths as decimal and sliced UTF-16 characters, but Next.js writes hex byte lengths (`1b:T13a0,`), so rows with a-f digits never resolved and multi-byte text would overrun -> hex parse and UTF-8 byte slicing in `unescapeNextFChunk`.
- [x] **ISSUE-103**: `normalizeSavedDataset` rebuilds datasets field by field and would drop `passages` on save -> field carried through.
- [x] **ISSUE-106**: Parser, storage and UI still injected invented metadata (`XAVALO`, `SP26`, `29/04/2026`) when fields were missing, undoing ISSUE-96 for saved items -> `N/A` in `parser.ts`, `storage.ts`, `ExtractTab.tsx`, `SavedTab.tsx`.
- [x] **ISSUE-98**: Panel question and option text collapsed code indentation -> `white-space: pre-wrap` on `.fus-q-text`, `.fus-q-opt-text`.

---

## II. Open & Verified Issues Register

Logged 2026-09-28 during the language-exam investigation (TRS501, TRS601, ENW493c, ENM302 on the live site).

- [ ] **ISSUE-104**: Writing sets (`_W`, `_RW`, e.g. `TRS501_SU26_H2_RE_W_185912`) are PDF-only PE exams exposed as `initialData.examUrl` with no answer key. Bulk export with `PE_BOTH` lists their ZIP as `Missing` in `manifest.md`, which reads as a failure. The payload has no field that distinguishes "no answer key exists" from "answer key URL not found", so the row is kept. Candidate: label it "not provided" when `examUrl` is present and no zip hint exists anywhere in the payload. Target: `src/utils/exporter.ts`.
- [ ] **ISSUE-105**: Source data artifact: `TRS501_SU26_H2_RE_R_748358` Q10 has a fifth option `E` whose text is a bare code fence. Exported faithfully; not a parser defect. Target: none (platform data).

---

## Summary Matrix of Verified Open Issues

| Issue ID | Category | Description | Severity | Target File |
| :--- | :--- | :--- | :--- | :--- |
| ISSUE-104 | Export | Writing sets show a `Missing` answer-key row that does not exist | Low | `src/utils/exporter.ts` |
| ISSUE-105 | Data | Junk option `E` in one TRS501 Reading question (platform data) | Info | n/a |

---

*Log updated in accordance with Stage 1 Issue Detection & Logging protocol.*

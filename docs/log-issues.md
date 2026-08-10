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

---

## II. Open & Verified Issues Register

### [ISSUE-81] Stripped CSS Styles & Missing KaTeX Stylesheet in `generatePrintHtml` Renders Ugly Plain Unstyled HTML PDF Layout
- **Status**: 🔴 **OPEN (Exporter / CSS Layout Defect)**
- **Symptom**: Exporting or printing an FE exam via `generatePrintHtml` produces an ugly, unstyled HTML page lacking card borders, badges, option list styling, typography hierarchy, and KaTeX math stylesheet rules.
- **Root Cause**:
  1. **Exact Deviating Commit Identified**: Commit `ebeb99e44a7999d1d70733a7feb734aade5fd54e` (`Fri Aug 7 14:45:58 2026 +0700` by Do Dang Khoa, message `temp commit`).
  2. In commit `ebeb99e`, lines 60–105 of `generatePrintHtml` in `src/utils/exporter.ts` stripped `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">` from `<head>`.
  3. The `<style>` block was stripped of 13 essential CSS rules (`body`, `.header`, `.header h1`, `.meta`, `.q-card`, `.q-title`, `.q-img`, `.options-list`, `.option`, `.option.correct`, `.badge`, `.option.correct .badge`).
  4. HTML element class names inside `questionsHtml` were renamed to `.question-block` / `.option-item` without writing corresponding CSS rules.
- **Target Files**:
  - [src/utils/exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L44-L116)
- **Remediation**:
  1. Restore the proven, beautiful HTML/CSS template from commit `6c6647831b80396270e86bd82de362f4175c892c` / `e8b7854` into `generatePrintHtml` in `src/utils/exporter.ts`.
  2. Re-include the KaTeX stylesheet link `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">` in `<head>`.
  3. Ensure all question cards (`.q-card`), titles (`.q-title`), option lists (`.options-list`), option items (`.option`), badges (`.badge`), correct answer highlights (`.option.correct`), and print media queries (`@media print`) match the CSS template rules.

---

## Summary Matrix of Verified Open Issues

| Issue ID | Category | Description | Severity | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-81** | Exporter / Layout | Stripped CSS Styles & Missing KaTeX Stylesheet in `generatePrintHtml` | 🔴 High | [exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L44-L116) |

---

*Log updated in accordance with Stage 1 Issue Detection & Logging protocol.*

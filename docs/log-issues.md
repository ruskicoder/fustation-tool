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
- [x] **ISSUE-67**: Folder & Batch Deletion UI Lag, Partial Delete & Extension Freeze/Crash -> Fixed via atomic `deleteExamsFromStorage()` in `src/utils/storage.ts` and `src/components/Overlay.tsx`.

---

## II. Open & Verified Issues Register

### [ISSUE-68] Duplicate "PE" Badges in `SavedTab.tsx` Child Record Rows
- **Status**: 🔴 **OPEN (UX Bug)**
- **Symptom**: In `SavedTab.tsx` child exam rows, PE exam items display two identical side-by-side badges reading `"PE"` (e.g. `[SP26] [PE] [PE] PRF192_FA25_PE_B3W_983472`).
- **Root Cause**: Line 289 renders `<span className="fus-badge fus-badge-campus">{typeStr}</span>` which evaluates to `"PE"`. Line 290 ALSO conditionally renders `{item.examCategory === 'PE' && <span className="fus-badge fus-badge-subject"...>PE</span>}`.
- **Target File**: [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx#L288-L290)
- **Remediation**: Render the pink PE category badge ONLY when `typeStr` does NOT already equal `'PE'`, or unify the type and category badge rendering logic into a single badge.

### [ISSUE-69] Search Query Filtered Folder Action Scope Discrepancy (Accidental Deletion Risk)
- **Status**: 🔴 **OPEN (UX Hazard / Unintended Data Loss Risk)**
- **Symptom**: When a user filters the saved exam list with a search query and clicks "Delete Folder" or "Export Folder" on a subject folder row, the operation deletes/exports ALL items belonging to that subject code in storage—including hidden items that do not match the search query.
- **Root Cause**: `groupedFolders` computes `folderIds` from all items under that subject code in `filteredList`. However, when a search query is active, users expect folder actions to target only the filtered subset, or present an explicit prompt.
- **Target File**: [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx#L248-L260), [src/components/Overlay.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/Overlay.tsx#L458-L469)
- **Remediation**: Scope folder delete and export actions strictly to `group.items` (the filtered items under that folder) when a search query is active.

### [ISSUE-70] `extractPeZipUrl` Fails on Presigned S3 URLs without Explicit `.zip` Extension Path
- **Status**: 🟡 **OPEN (Parser Boundary)**
- **Symptom**: Presigned S3 ZIP URLs that use query parameters for authentication (e.g. `https://s3.amazonaws.com/bucket/key_material?X-Amz-Algorithm=...`) or uppercase `.ZIP` extensions are missed by Stage 4 of `extractPeZipUrl`.
- **Root Cause**: Regex pattern in `extractPeZipUrl` requires literal `.zip` in the path string before query parameters.
- **Target File**: [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts#L340-L345)
- **Remediation**: Update regex patterns to match case-insensitive `.zip` and presigned query strings containing `material` or `answer-key`.

### [ISSUE-71] `ViewerPanel` PDF Iframe 404 Fallback Error on Non-Numeric `dataset.id`
- **Status**: 🔴 **OPEN (Network / PDF Render Defect)**
- **Symptom**: When viewing a PE exam whose `dataset.id` was fallback-generated (e.g. `exam_PRF192_1720000000000`), the embedded PDF viewer attempts to load `/api/exams/pdf?productId=exam_PRF192_1720000000000`, resulting in a 404 error from FUSTATION backend.
- **Root Cause**: `ViewerPanel.tsx` constructs `/api/exams/pdf?productId=${dataset.id}` without verifying if `dataset.id` is a numeric product ID.
- **Target File**: [src/components/ViewerPanel.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/ViewerPanel.tsx#L162-L172)
- **Remediation**: Extract numeric product ID from `dataset.id`, `dataset.pdfUrl`, or `dataset.title` before attempting to construct the API URL.

### [ISSUE-72] Concurrent `chrome.storage.local` Read-Modify-Write Race Condition in Batch Fetcher
- **Status**: 🔴 **OPEN (Storage Concurrency Hazard)**
- **Symptom**: Rapid sequential `saveExamToStorage` calls during automated batch fetches can overwrite concurrent storage writes (e.g. simultaneous user deletion or setting updates) due to un-queued async `chrome.storage.local.get` / `set` operations.
- **Root Cause**: `saveExamToStorage` reads the current storage map, appends the new exam item, and writes back without serializing write transactions.
- **Target File**: [src/utils/storage.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/storage.ts#L86-L130), [src/utils/batchFetcher.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/batchFetcher.ts#L257)
- **Remediation**: Implement a lightweight in-memory storage write queue or atomic mutex lock for `saveExamToStorage`.

### [ISSUE-73] Incomplete Session Metadata in `generatePrintHtml` PDF Cover Header
- **Status**: 🟡 **OPEN (Export Format Inconsistency)**
- **Symptom**: PDF exports generated via `generatePrintHtml` lack `examSessionTime` ("Session Time") and `examSessionDate` ("Session Date") in the cover page header table, whereas Markdown exports include them.
- **Root Cause**: `generatePrintHtml` in `exporter.ts` renders Subject, Term, Type, Campus, and Total Questions, but omits session time/date fields.
- **Target File**: [src/utils/exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L107-L111)
- **Remediation**: Add Session Time and Session Date metadata rows to `generatePrintHtml()`.

### [ISSUE-74] `exportBulkAsZip` Skipping PDF Assets when `dataset.pdfUrl` is Null
- **Status**: 🔴 **OPEN (Bulk Export Defect)**
- **Symptom**: When performing bulk ZIP export of saved PE items, PDF papers are omitted from the output zip file if `ds.pdfUrl` is `null`, even though the PDF is available via `/api/exams/pdf?productId=${ds.id}`.
- **Root Cause**: Lines 249-254 of `exporter.ts` check `if (ds.pdfUrl)` directly without resolving the fallback PDF endpoint.
- **Target File**: [src/utils/exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L249-L254)
- **Remediation**: Resolve PDF URL via `ds.pdfUrl || (ds.id && ds.id !== 'unknown' ? `/api/exams/pdf?productId=${ds.id}` : null)` before fetching PDF buffers in `exportBulkAsZip`.

### [ISSUE-75] `FormatSwitcher` Mixed-Mode Label Layout Overflow on Minimum Panel Width (380px)
- **Status**: 🟡 **OPEN (Layout Cutoff)**
- **Symptom**: When both FE and PE items are selected in `SavedTab`, `FormatSwitcher` renders a 3x2 matrix of buttons. On 380px minimum panel width, label text wraps awkwardly and causes visual vertical overflow in the top drag header.
- **Root Cause**: Fixed grid spacing and button padding in `FormatSwitcher.tsx` when rendering mixed mode controls inside a constrained header toolbar.
- **Target File**: [src/components/FormatSwitcher.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/FormatSwitcher.tsx#L40-L75), [src/styles/overlay.css](file:///mnt/DATA/DATA/Github/fustation-tool/src/styles/overlay.css)
- **Remediation**: Adjust CSS padding and font size for header format switcher in mixed mode or wrap in compact dropdown format.

---

## Summary Matrix of Verified Open Issues

| Issue ID | Category | Description | Severity | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-68** | UI / Badges | Duplicate "PE" Badges in `SavedTab.tsx` Child Record Rows | 🔴 High UX | [SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx#L288-L290) |
| **ISSUE-69** | Business Logic | Search Query Filtered Folder Action Scope Discrepancy | 🔴 High Safety | [SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx#L248-L260) |
| **ISSUE-70** | Parser | `extractPeZipUrl` Fails on Presigned S3 URLs without `.zip` Path | 🟡 Medium | [parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts#L340-L345) |
| **ISSUE-71** | Network / PDF | `ViewerPanel` PDF Iframe 404 Error on Non-Numeric `dataset.id` | 🔴 High | [ViewerPanel.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/ViewerPanel.tsx#L162-L172) |
| **ISSUE-72** | Storage Race | `chrome.storage.local` Concurrency Write Overwriting in Batch Fetcher | 🔴 High Concurrency | [storage.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/storage.ts#L86-L130) |
| **ISSUE-73** | Exporter | Incomplete Session Metadata in `generatePrintHtml` Cover Header | 🟡 Low | [exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L107-L111) |
| **ISSUE-74** | Exporter | `exportBulkAsZip` Skipping PDF Assets when `pdfUrl` is Null | 🔴 High | [exporter.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/exporter.ts#L249-L254) |
| **ISSUE-75** | Layout | `FormatSwitcher` Mixed-Mode Label Overflow on 380px Panel Width | 🟡 Medium | [FormatSwitcher.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/FormatSwitcher.tsx#L40-L75) |

---

*Log updated in accordance with Stage 1 Issue Detection & Logging protocol.*

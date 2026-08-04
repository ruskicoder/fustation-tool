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
- [x] **ISSUE-13**: ExtractTab ExamSet Badges / 5-Row Metadata Layout -> Fixed in `src/components/ExtractTab.tsx`.
- [x] **ISSUE-14**: SavedTab Per-Item `[Delete][Download]` Action Buttons -> Fixed in `src/components/SavedTab.tsx`.
- [x] **ISSUE-15**: Redundant Header Controls (Single Minimize button) -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-17**: `unescapeNextFChunk` Raw Control Character (`\n`) JSON Parse Crash -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-18**: Cascade Fallback & Dummy Default Placeholders (`XAVALO`, `['A']`) -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-19**: Live Script Extraction String Match Failure (Escaped Quotes in RSC Chunks) -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-20**: DOM Crawler Text Answer Reveal, Single/Multi-Choice Support & Partial Fetch UI -> Fixed in `src/utils/parser.ts`, `src/components/ExtractTab.tsx`, and `src/styles/overlay.css`.
- [x] **ISSUE-21**: SPA Route Navigation, Targeted Product ID Filtering & Auto-Save -> Fixed in `manifest.json`, `src/background.ts`, `src/utils/parser.ts`, `src/components/Overlay.tsx`, and `src/styles/overlay.css`.
- [x] **ISSUE-22**: Manual Save Resilience, React State Map Copies & Unlimited Storage -> Fixed in `src/utils/storage.ts`, `src/components/Overlay.tsx`, and `manifest.json`.
- [x] **ISSUE-23**: Exported Filename Deduplication -> Fixed in `src/utils/exporter.ts`.
- [x] **ISSUE-25**: Metadata Header Term & ExamType Title Precedence -> Fixed in `src/types/index.ts`, `src/utils/parser.ts`, `src/utils/compiler.ts`, `src/utils/exporter.ts`, and `src/components/ExtractTab.tsx`.
- [x] **ISSUE-28**: DOM Crawler Navigation & State Synchronization Failure -> Fixed in `src/utils/parser.ts`.
- [x] **ISSUE-29**: Manual Fetch Failure & Answer N/A (Switch to Instant RSC Script Parser) -> Fixed in `src/components/Overlay.tsx`.
- [x] **ISSUE-30**: Session Time Metadata Extraction & Dynamic Fallback to N/A -> Fixed in `src/utils/parser.ts`, `src/utils/compiler.ts`, `src/utils/storage.ts`, and `src/components/ExtractTab.tsx`.
- [x] **ISSUE-31**: Extension Reload Proofing & State Resilience on Cold/Fetch Reloads -> Fixed in `src/utils/storage.ts` and `src/components/Overlay.tsx`.
- [x] **ISSUE-32**: Persistent Panel State & Auto-Open Persistence (`isExpanded`, `activeTab`) -> Fixed in `src/utils/storage.ts` and `src/components/Overlay.tsx`.
- [x] **ISSUE-33**: SavedTab Outline View & Subject Folder Hierarchy -> Fixed in `src/components/SavedTab.tsx` and `src/styles/overlay.css`.
- [x] **ISSUE-34**: Enhanced Folder & Record Row Badge Layouts -> Fixed in `src/components/SavedTab.tsx` and `src/styles/overlay.css`.
- [x] **ISSUE-35**: Global Unified Header Format Selector Relocation -> Fixed in `src/components/Overlay.tsx`, `src/components/FormatSwitcher.tsx`, `src/components/ExtractTab.tsx`, and `src/styles/overlay.css`.
- [x] **ISSUE-36**: ExtractTab Panel Restructuring & SavedTab Sticky Toolbar Overhaul -> Fixed in `src/components/ExtractTab.tsx`, `src/components/SavedTab.tsx`, `src/components/Overlay.tsx`, and `src/styles/overlay.css`.
- [x] **ISSUE-37**: Panel Geometry Integration & Drag/Resize Handlers Wiring -> Fixed in `src/components/Overlay.tsx`, `src/hooks/usePanelGeometry.ts`, and `src/components/ResizeHandles.tsx`.
- [x] **ISSUE-38**: Dynamic Theme Switching & Theme Storage Integration -> Fixed in `src/components/Overlay.tsx`, `src/utils/storage.ts`, `src/types/index.ts`, and `src/styles/overlay.css`.
- [x] **ISSUE-39**: Transient Toast Notification Queue Wiring -> Fixed in `src/components/Overlay.tsx`, `src/hooks/useToasts.ts`, and `src/components/ToastHost.tsx`.
- [x] **ISSUE-40**: Skeleton Shimmer Loading Feedback Integration -> Fixed in `src/components/ExtractTab.tsx`, `src/components/SavedTab.tsx`, and `src/components/Skeleton.tsx`.
- [x] **ISSUE-41**: Icon Dictionary Consolidation (`Icons.tsx`) -> Fixed across `src/components/Overlay.tsx`, `ExtractTab.tsx`, `SavedTab.tsx`, `FormatSwitcher.tsx`, `ToastHost.tsx`, and `ResizeHandles.tsx`.

---

## II. Open & Deferred Issues Register

### [ISSUE-07] Incomplete Markdown & PDF Exporter Metadata Headers
- **Status**: 🟡 **NICE-TO-HAVE**
- **Symptom**: Compiled Markdown files and PDF print documents omit Campus, Term, and Exam Session details in the `# [info]` header block.
- **Remediation**:
  - Update `compileMarkdown()` in `src/utils/compiler.ts`.
  - Update `generatePrintHtml()` in `src/utils/exporter.ts`.

### [ISSUE-11] Storage Cache Schema Backward-Compatibility
- **Status**: 🟢 **RESOLVED & NORMALIZED**
- **Symptom**: Pre-existing exam items saved in `chrome.storage.local` before schema updates lack newly added fields (`campus`, `examType`, `examSessionTime`, `examSessionDate`).
- **Remediation**: Implemented `normalizeSavedDataset(dataset: any): ExamDataset` in `src/utils/storage.ts`.

### [ISSUE-12] Catalog Discovery & Server Action Pagination
- **Status**: 🔵 **FUTURE ROADMAP**
- **Routes**: `/home` and `/subjects/[subjectCode]`
- **Mechanism**:
  - Parse `initialProducts` array from catalog page RSC stream.
  - Intercept POST Server Action requests to fetch full product list for batch extraction.

### [ISSUE-16] In-Extension Saved ExamSet Viewing / Preview Mode
- **Status**: 🔴 **DEFERRED FOR FUTURE IMPLEMENTATION**
- **Symptom**: Saved examsets in `SavedTab.tsx` cannot be inspected or viewed directly within the extension overlay.
- **Current State**: Added `[ View Questions ]` placeholder button on `ExtractTab.tsx` and `SavedTab.tsx`.
- **Planned Remediation**: Full preview sub-view or expandable accordion viewer inside `SavedTab`.

### [ISSUE-24] SavedTab Missing Partial Fetch Badge Indicator
- **Status**: 🟢 **RESOLVED & RENDERED**
- **Symptom**: Saved items in `SavedTab.tsx` display question count (e.g. `45Q`), but do not indicate whether the dataset was saved as a partial fetch (`isPartial`), obscuring fetch quality.
- **Remediation**: Rendered `[Partial]` badge in `SavedTab.tsx` child rows when `item.isPartial` is true.

---

## Summary Matrix of Remaining Issues

| Issue ID | Category | Description | Status | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-07** | Exporter | Enhanced `# [info]` block for Markdown & PDF cover | 🟡 Nice-to-Have | [src/utils/compiler.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/compiler.ts) |
| **ISSUE-11** | Storage | Storage cache normalization for legacy cached datasets | 🟢 Resolved | [src/utils/storage.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/storage.ts) |
| **ISSUE-12** | Catalog | Catalog route `initialProducts` batch extraction | 🔵 Roadmap | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-16** | Feature | In-Extension Saved ExamSet Viewing / Preview Mode | 🔴 Deferred | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |
| **ISSUE-24** | Saved UI | Missing partial fetch badge indicator in SavedTab rows | 🟢 Resolved | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |

---

*Log updated in accordance with Stage 5 completion protocol.*



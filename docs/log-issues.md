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
- [x] **ISSUE-12**: Catalog Discovery, RSC API Queue & Interactive Batch Extraction -> Fixed in `src/utils/batchFetcher.ts`, `src/components/ExtractTab.tsx`, `src/components/Overlay.tsx`, `src/styles/overlay.css`.

---

## II. Open & Deferred Issues Register

### [ISSUE-07] Incomplete Markdown & PDF Exporter Metadata Headers
- **Status**: 🟡 **NICE-TO-HAVE**
- **Symptom**: Compiled Markdown files and PDF print documents omit Campus, Term, and Exam Session details in the `# [info]` header block.
- **Remediation**:
  - Update `compileMarkdown()` in `src/utils/compiler.ts`.
  - Update `generatePrintHtml()` in `src/utils/exporter.ts`.

---

## Summary Matrix of Remaining Open Issues

| Issue ID | Category | Description | Status | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-07** | Exporter | Enhanced `# [info]` block for Markdown & PDF cover | 🟡 Nice-to-Have | [src/utils/compiler.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/compiler.ts) |

---

*Log updated in accordance with Stage 5 Issue Purge protocol.*

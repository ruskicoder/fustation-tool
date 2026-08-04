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

### [ISSUE-42] `isManual` Guard Locks All Auto-Fetch Paths Into the Broken DOM Crawler
- **Status**: 🟢 **RESOLVED**
- **Symptom**: Once `extractExamFromScripts()` fails on any auto-fetch, all subsequent `runFetch()` calls silently fall into `crawlExamFromDOM` (which also fails). Reload recovery was gated behind `if (isManual)` and unreachable from auto paths.
- **Root Cause**: `runFetch` bifurcated on `isManual`. All auto-fetch paths (`useEffect` on mount, `getPendingFetchFromStorage`, `chrome.runtime.onMessage`) called `runFetch()` without the flag, permanently routing to DOM crawl.
- **Remediation Applied**: Replaced two-branch design with unified 4-phase pipeline (`useCallback`). All call sites (auto and manual) use the same `runFetch()`. DOM crawl removed from all paths. `isManual` parameter deleted.
- **Symptom**: Once `extractExamFromScripts()` fails on any auto-fetch (initial mount, SPA route change, post-reload), all subsequent `runFetch()` calls silently fall into `crawlExamFromDOM` (which also fails — see ISSUE-43). The reload recovery path in `runFetch` is gated behind `if (isManual)` and is only reachable from the manual Fetch button click. The auto-fetch paths (`useEffect` on mount, `getPendingFetchFromStorage` callback, `chrome.runtime.onMessage` SPA route handler) all call `runFetch()` with no argument (`isManual = false` default), permanently bypassing the reload recovery.
- **Root Cause**: `runFetch` in `src/components/Overlay.tsx` bifurcates on `isManual`:
  - `isManual = true` → reload recovery (correct path, only reachable manually)
  - `isManual = false` → DOM crawl fallback (broken path, all auto paths land here)
- **Impact**: Extension completely fails to extract data on page load unless user manually clicks Fetch. Even after a manual-triggered reload, the `getPendingFetchFromStorage` callback calls `runFetch()` without `isManual`, so if the RSC parse still races, it falls into DOM crawl again instead of surfacing an error.
- **Remediation**:
  - Replace the two-branch `isManual` design with a **unified polling pipeline**: (1) instant parse → (2) polling retry loop (300ms × 10 attempts, 3s total) → (3) single reload (guarded by a new `fustation_reload_attempted` flag to prevent reload loops) → (4) surface error.
  - All `runFetch()` call sites (auto and manual) must go through the same unified pipeline.
  - Remove DOM crawl from the primary fetch path entirely.
- **Target Files**: `src/components/Overlay.tsx`, `src/utils/storage.ts`

---

### [ISSUE-43] DOM Crawler (`crawlExamFromDOM`) Produces Empty Options and No Correct Answers
- **Status**: 🟢 **RESOLVED** (removed from pipeline; deprecated)
- **Symptom**: When DOM crawl ran, all questions returned `options: []` and `correctAnswers: []`. Question text parsed but answer data was always absent.
- **Root Cause**: Selector mismatch (`button[role="radio"]` vs actual Radix UI `div[role="radio"]` wrappers), click-to-reveal never fired, wrong DOM layer targeted.
- **Remediation Applied**: `crawlExamFromDOM` removed from `runFetch` and all imports in `Overlay.tsx`. Function marked `@deprecated` in `parser.ts` with explanatory JSDoc. Never reached in normal operation.
- **Symptom**: When DOM crawl runs (triggered by ISSUE-42), all questions return `options: []` and `correctAnswers: []`, rendered as N/A in the UI. Question text may parse from `h2` but answer data is always absent.
- **Root Cause — Three Layers**:
  1. **Selector mismatch**: The crawler targets `div.space-y-2\.5 button`, `button[role="radio"]`, `button[data-slot="button"]`. fustation.net renders Radix UI primitives using `<div role="radio">` or `<label>` wrapper groups — not native `<button>` elements — so all three selectors return 0 elements.
  2. **Click-to-reveal never fires**: `optBtns[0].click()` is skipped because `optBtns` is always empty (Layer 1), so the `Đáp án đúng:` text is never revealed, and the extraction regex never matches.
  3. **Wrong DOM layer targeted**: The RSC streaming payload (`self.__next_f.push`) is the authoritative data source. The live DOM is the React-hydrated output of that payload. The crawler targets the hydrated React output layer, which does not expose raw option/answer data in queryable form.
- **Confirmed by web research**: `MutationObserver` + correct selectors verified against the live rendered DOM are required. Content scripts operate in isolated worlds and cannot access `self.__next_f` directly.
- **Remediation**:
  - **Primary**: Fix the RSC payload extraction (ISSUE-42 polling pipeline) so the DOM crawler is never reached in normal operation.
  - **Secondary (if DOM crawl is retained as fallback)**: Audit live DOM selectors against the actual hydrated fustation.net markup. Replace `button[role="radio"]` with `div[role="radio"], label[data-state]` or equivalent verified selectors. Use `MutationObserver` to wait for the answer reveal state change after click.
- **Target Files**: `src/utils/parser.ts`

---

### [ISSUE-44] RSC Payload Streaming Race — 100ms Single-Shot Buffer Insufficient
- **Status**: 🟢 **RESOLVED**
- **Symptom**: `extractExamFromScripts()` returned `null` on initial mount because it fired after only 100ms — before the Next.js RSC stream finished.
- **Root Cause**: Single `setTimeout(r, 100)` before parse. Next.js App Router streams RSC payload progressively; 100ms insufficient on any non-cached connection.
- **Remediation Applied**: Replaced 100ms single-shot with **polling retry loop**: `extractExamFromScripts()` called every 300ms for up to 10 attempts (3s total). Each attempt re-reads `document.documentElement.innerHTML` to catch newly streamed chunks.
- **Symptom**: `extractExamFromScripts()` returns `null` on initial mount despite the RSC payload being present in the final page HTML, because it fires after only 100ms — before the Next.js RSC stream has finished writing all `self.__next_f.push(...)` script chunks to the DOM.
- **Root Cause**: `runFetch` in `Overlay.tsx` awaits a single `new Promise(r => setTimeout(r, 100))` before calling `extractExamFromScripts()`. Next.js App Router streams the RSC payload progressively; on any connection that isn't locally cached, the critical `initialData` chunk arrives after the 100ms window. A single fixed-delay parse is fundamentally unreliable for streaming pages.
- **Confirmed by web research**: Next.js streams HTML in progressive chunks via `self.__next_f.push`. An extension scanning at `document_idle` + 100ms may miss the full content. The recommended approach is a retry loop or `MutationObserver` watching for new script tags to be appended.
- **Remediation**:
  - Replace the 100ms `setTimeout` with a **polling retry loop**: attempt `extractExamFromScripts()` every 300ms for up to 3 seconds (10 retries). On each retry, re-read `document.documentElement.innerHTML` to catch newly streamed chunks.
  - Optionally attach a `MutationObserver` on `document.documentElement` (`subtree: true`, `childList: true`) to detect when new `<script>` tags are appended, triggering a parse attempt immediately on each new script insertion.
- **Target Files**: `src/components/Overlay.tsx`, optionally `src/utils/parser.ts`

---

### [ISSUE-45] `runFetch` Stale Closure Inside `useEffect([], [])` — Toast & State Calls May Be Silent
- **Status**: 🟢 **RESOLVED**
- **Symptom**: Post-reload `getPendingFetchFromStorage` callback called a stale `runFetch` captured at first render. `push()`, `setCurrentDataset()`, `setStatus()` inside stale closure may silently no-op.
- **Root Cause**: `runFetch` re-created on every render, referenced via zero-dependency `useEffect` closure.
- **Remediation Applied**: "Latest Ref" pattern: `runFetchRef = useRef(null)` always updated in a bare `useEffect`. All three auto-fetch call sites (`getPendingFetchFromStorage`, post-reload pending path, SPA route observer) now call `runFetchRef.current?.()` instead of `runFetch()` directly. `runFetch` itself wrapped in `useCallback([push])` for stable identity.
- **Symptom**: After a reload triggered by the manual fetch recovery path, the `getPendingFetchFromStorage` callback calls `runFetch()`. Because `runFetch` is defined inside the React component without `useCallback`, the version captured inside `useEffect(() => {}, [])` (empty deps) is stale from the initial render. `push()` (toast), `setCurrentDataset()`, and `setStatus()` inside the stale closure may reference disconnected or early-render state updaters.
- **Root Cause**: `runFetch` is re-created on every render but referenced via closure inside a zero-dependency `useEffect`. In React 18 Strict Mode (double-invocation), the effect runs twice on mount, potentially capturing the first-render closure. The stale `push` ref means toast notifications for post-reload fetch results may silently no-op.
- **Remediation**:
  - Wrap `runFetch` in `useCallback` with explicit dependency array, or extract it to a `useRef`-stable callback pattern (store the latest version in a ref, call `ref.current()` from the effect).
  - Alternatively, once ISSUE-42 is resolved with a unified pipeline, `runFetch` will be extracted into a stable top-level utility that no longer captures React state directly.

### [ISSUE-46] `tryParsePartialJson` Naive Quote Detection Breaks on Literal `\` Before String Close (`\\"`)
- **Status**: 🟢 **RESOLVED** — Fixed in `src/utils/parser.ts`.
- **Symptom**: Certain examsets (e.g. JPD113_SP26_FE_475290) never load — all four fetch phases (instant parse, polling, guarded reload) fail and the extension surfaces "Could not extract exam data". Root cause is NOT the SPA / stale state / polling pipeline; it's a parser escape-handling bug.
- **Root Cause**: `tryParsePartialJson()` tracked quote toggling with the naive check `char === '"' && str[i-1] !== '\\'`. When a question's text ends with a literal backslash immediately before the string-closing quote (RSC payload decodes to `...きょうしです。\` + `"`), the quote is preceded by an EVEN number of backslashes (`\\"`), so the naive check wrongly treated it as an escaped quote and never toggled `inString` back off. Brace depth then never returns to 0, `JSON.parse` fails mid-object, and `unescapeNextFChunk()` returns `null`.
- **Evidence**:
  - `docs/webfetches/examview/examplehtml-examview.html` (JPD113): `tryParsePartialJson` returns `null`; payload is otherwise valid — `JSON.parse(slice)` errors only on trailing wrapper chars at pos 10808.
  - `docs/webfetches/examview/examplehtml-examview-2.html` (PRO192): parses fine (no `\\"` sequence) — confirms it's data-dependent, not pipeline-dependent.
  - Reproduced in `scratch/diag_parser.cjs`, `scratch/diag_html1b.cjs`; fix validated in `scratch/diag_fix_test.cjs`.
- **Remediation (applied)**: Replaced the single-previous-char check with a backslash-parity helper `isEscapedQuote(str, i)` — a quote is an escape boundary only when preceded by an ODD number of backslashes. Verified both fixtures: JPD113 → 30 questions, PRO192 → 50 questions. `npm run build` passes with integration tests.
- **Target Files**: `src/components/Overlay.tsx`

---

## Summary Matrix of Remaining Issues

| Issue ID | Category | Description | Status | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-07** | Exporter | Enhanced `# [info]` block for Markdown & PDF cover | 🟡 Nice-to-Have | [src/utils/compiler.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/compiler.ts) |
| **ISSUE-11** | Storage | Storage cache normalization for legacy cached datasets | 🟢 Resolved | [src/utils/storage.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/storage.ts) |
| **ISSUE-12** | Catalog | Catalog route `initialProducts` batch extraction | 🔵 Roadmap | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-16** | Feature | In-Extension Saved ExamSet Viewing / Preview Mode | 🟢 Implemented | [src/components/ViewerPanel.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/ViewerPanel.tsx) |
| **ISSUE-24** | Saved UI | Missing partial fetch badge indicator in SavedTab rows | 🟢 Resolved | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |
| **ISSUE-42** | Fetch | `isManual` guard locks all auto-fetch into broken DOM crawl | 🟢 Resolved | [src/components/Overlay.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/Overlay.tsx) |
| **ISSUE-43** | Parser | DOM crawler produces empty options & N/A answers (selector mismatch) | 🟢 Resolved | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-44** | Fetch | RSC payload streaming race — 100ms buffer too short, no retry loop | 🟢 Resolved | [src/components/Overlay.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/Overlay.tsx) |
| **ISSUE-45** | Fetch | `runFetch` stale closure in `useEffect([], [])` — silent toast/state failure | 🟢 Resolved | [src/components/Overlay.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/Overlay.tsx) |
| **ISSUE-46** | Parser | `tryParsePartialJson` naive quote detection breaks on literal `\` before string close (`\\"`), killing some examsets entirely | 🟢 Resolved | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |

---

*Log updated in accordance with Stage 1 Issue Detection protocol. Issues ISSUE-42 through ISSUE-45 added following mandatory web search and full codebase audit of `src/utils/parser.ts` and `src/components/Overlay.tsx`.*

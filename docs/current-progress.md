# Current Progress & Technical Roadmap: fustation-tool

## 1. Active Feature Implementation Status

- [x] **Manifest V3 Setup**: Content script injection, service worker, storage permissions for `fustation.net`.
- [x] **TypeScript + React TS Stack**: Vite build pipeline outputting to `/dist`.
- [x] **Fixed 2:1 Aspect Ratio Panel**: Overlay locked to `580px` width × `290px` height.
- [x] **Zero-Shift Header Status Pill**: Fixed `140px` width status container.
- [x] **Hybrid Parser & Interactive Async DOM Crawler**: Full HTML parsing + step-by-step DOM Crawler for 1..N questions.
- [x] **Universal Format Switcher**: Radix-style Segmented Control (`MD` | `PDF` | `JSON`).
- [x] **Separated Save vs Download Business Logic**: `[ Save ]` caches dataset without file downloads; `[ Download ]` exports selected filetype.
- [x] **Sticky Saved Tab Toolbar**: Top toolbar remains fixed at top of tab container when scrolling saved items.
- [x] **Red Clear-All Danger Button**: Styled with `.fus-btn-danger`.
- [x] **Option Text Sanitization**: Prefix removal (`A.`, `A:`, `A `) and text deduplication.
- [x] **Robust RSC Stream Parser (ISSUE-01)**: Anchors directly to `"initialData":` across Next.js push chunks regardless of key order.
- [x] **Semantic DOM Crawler Selectors (ISSUE-02)**: Robust fallbacks using `[data-slot="card"]`, `button[role="radio"]`, `h2`.
- [x] **Next.js `$D` ISO Date Stripping (ISSUE-03)**: `sanitizeRscDate()` strips `$D` prefix and formats `DD/MM/YYYY`.
- [x] **HTML Entity Decoding (ISSUE-04)**: `decodeHtmlEntities()` unescapes `&amp;`, `&quot;`, `&#x27;`, `&lt;`, `&gt;`.
- [x] **Extended ExamDataset Schema (ISSUE-05)**: Added `campus`, `examType`, `examSessionTime`, `examSessionDate`, `parsedTitle`.
- [x] **Tokenized Regex Exam Code Parser (ISSUE-06)**: `parseExamCode()` extracts `SubjectCode`, `Term`, `Type`, `ExamCode`.
- [x] **ExtractTab 5-Row Metadata Layout (ISSUE-13)**: 30/40/30 & 70/30 grid splits + `[ View Questions ]` placeholder button.
- [x] **SavedTab Per-Item Delete Button (ISSUE-14)**: Added `[ Delete ]` button before `[ Download ]` for single item cache removal.
- [x] **Single Minimize Header Control (ISSUE-15)**: Removed redundant `×` Close button, retained `–` Minimize button.
- [x] **Control Character JSON Crash Fix (ISSUE-17)**: Preserved embedded `\n` escapes in `unescapeNextFChunk()` prior to `JSON.parse()`.
- [x] **Metadata & Answer Fallback Cleanup (ISSUE-18)**: Mapped `prod.description` $\rightarrow$ `campus`, preserved single/multi-choice `correctAnswers` without forcing dummy `['A']`.
- [x] **Next.js Escaped Quote RSC Stream Parser (ISSUE-19)**: Broadened script detection guard and unescaped `\"` in `unescapeNextFChunk()`.
- [x] **Text Answer Reveal DOM Crawler & Partial Fetch UI (ISSUE-20)**: Implemented 100ms hydration delay, text answer reveal regex `/Đáp án\s*đúng\s*:\s*([A-E,\s\n]+)/i` for single & multi-choice, and `Fetched with fails: [success] ✓ | [failed] ✗` ExtractTab indicator below Exam Code.
- [x] **SPA Route Navigation, Targeted Product ID Filtering & Auto-Save (ISSUE-21)**: Added `chrome.webNavigation.onHistoryStateUpdated` listener, product ID filtering in `extractExamFromScripts()`, 100ms render buffer for `Fetching...` status pill, and automatic save (`Autosaving...`) when exiting exam pages to `/home/subject/[code]`.
- [x] **Manual Save Resilience, Deterministic Storage Identifier & React Immutability (ISSUE-22)**: Fixed `saveExamToStorage()` to produce shallow object map copies (`{ ...list }`) for React state identity triggers in `Overlay.tsx`, generated deterministic primary keys (`[subjectCode]_[examCode]`), and added `"unlimitedStorage"` permission to `manifest.json`.
- [x] **Exported Filename Deduplication (ISSUE-23)**: Deduplicated `subjectCode` prefix prepending in `exportExam()` when `sanitizedTitle` already starts with `subjectCode`.
- [x] **Metadata Title Token Precedence & Dynamic Header Formatting (ISSUE-25)**: Enforced `parsedCode.term` (`SU26`) and `parsedCode.examType` (`RE`) precedence over server DB enum defaults (`prod.examType = "FE"`), added `term` to `ExamDataset` & `SavedExamItem`, eliminated hardcoded `"SP26"` literals, and updated `compileMarkdown()` and `generatePrintHtml()`.
- [x] **DOM Crawler Navigation & State Synchronization (ISSUE-28)**: Fixed total question count detection to sidebar `h3` (`Câu hỏi X / Y`), introduced mandatory rewind phase (`Làm lại đề`), and replaced blind delays with polling state sync.
- [x] **Instant RSC Script Manual Fetch & Reload Fallback (ISSUE-29)**: Updated `handleFetch` to extract Next.js RSC hydration script tags directly in <50ms with 100% correct answer keys, and added `window.location.reload()` fallback for missing script payloads.
- [x] **Dynamic Session Time Extraction & N/A Fallback (ISSUE-30)**: Replaced hardcoded default session time `'09:10'` with `extractSessionTimeFromText()` 3-pass extraction, outputting explicit `'N/A'` when session time is missing.
- [x] **Extension Reload Proofing & Fetch State Resilience (ISSUE-31)**: Added `fustation_pending_fetch` storage flag to `chrome.storage.local`. Automatically resumes manual fetch extraction post-reload without user re-intervention.
- [x] **Persistent Panel State & Auto-Open Persistence (ISSUE-32)**: Added `fustation_panel_expanded` and `fustation_active_tab` to `chrome.storage.local`. Automatically restores panel open/closed state (`isExpanded`) and active tab (`activeTab`) across page reloads and SPA navigation.
- [x] **SavedTab Outline View & Subject Folder Hierarchy (ISSUE-33)**: Grouped saved exams by subject code with expandable folder accordions in `SavedTab.tsx`.
- [x] **Enhanced Folder & Record Row Badge Layouts (ISSUE-34)**: Updated badges for subject folders, exam type, term, and partial fetch flags.
- [x] **Global Format Switcher Relocation (ISSUE-35)**: Moved `FormatSwitcher` to the header in `Overlay.tsx`.
- [x] **ExtractTab Panel Restructuring & SavedTab Sticky Toolbar Overhaul (ISSUE-36)**: Redesigned ExtractTab metadata layout and SavedTab sticky header controls.
- [x] **Panel Geometry & Drag/Resize Handlers (ISSUE-37)**: Implemented draggable, resizable overlay panel with bounds safety in `usePanelGeometry.ts` and `ResizeHandles.tsx`.
- [x] **Dynamic Theme System (ISSUE-38)**: Supported 4 visual themes (`glass-dark`, `glass-light`, `cyberpunk`, `nordic`) saved in local storage.
- [x] **Transient Toast Notification Queue (ISSUE-39)**: Managed toast notifications via `useToasts.ts` and `ToastHost.tsx`.
- [x] **Skeleton Shimmer Loaders (ISSUE-40)**: Replaced empty loading states with shimmering skeleton components in `Skeleton.tsx`.
- [x] **Icon Dictionary Consolidation (ISSUE-41)**: Consolidated SVG icons into `Icons.tsx`.
- [x] **Unified 4-Phase RSC Pipeline (ISSUE-42, ISSUE-44, ISSUE-45)**: Replaced two-branch `isManual` design with a unified 4-phase pipeline (0ms instant parse -> 300ms x10 polling retry -> single guarded reload -> surface error). Removed DOM crawler from auto-fetch paths. Added `fustation_reload_attempted` guard in `src/utils/storage.ts` and `runFetchRef` in `src/components/Overlay.tsx` to fix stale closure issues.
- [x] **Deprecated DOM Crawler (ISSUE-43)**: Marked `crawlExamFromDOM` as `@deprecated` with explanatory JSDoc and removed it from the primary fetch flow.
- [x] **RSC Parser Quote Escape Fix (ISSUE-46)**: Implemented `isEscapedQuote` helper in `src/utils/parser.ts` to count preceding backslashes, handling literal backslashes before string-closing quotes (e.g., `\\"` in JPD113 payload).
- [x] **In-Extension ExamSet Viewer Panel (ISSUE-16)**: Built `ViewerPanel.tsx`, `QuestionCard.tsx`, `QuestionList.tsx`, `ScrollspyRail.tsx`, `ImageLightbox.tsx`, `highlight.ts`, and `panelCollision.ts` for inline exam inspection.
- [x] **ImageLightbox Dialog Hotfix**: Ensured `ImageLightbox` returns `null` when image URL is falsy so empty `<dialog>` element is never rendered in the DOM.
- [x] **Batch Exam Extraction System & Interactive Preview Flow (ISSUE-12)**: Implemented catalog product discovery, background RSC API worker queue, interactive preview verification flow, `chrome.storage.local` state persistence, responsive preview controls, and full exam code header display.


---

## 2. Updated Exam Code Specification

Exam codes are tokenized as:
```
[SubjectCode]_[Term]_[Type]_[ExamCode]
```

- **`SubjectCode`**: **3 Alphas + 3 Numericals + 0-2 Optional Alphas** (`^[A-Z]{3}\d{3}[A-Za-z]{0,2}`). E.g. `MLN122`, `DBM302m`, `WED201C`, `SWE202C`. Positioned strictly at **START**.
- **`Term`**: **2 Alphas + 2 Numericals** (`[A-Z]{2}\d{2}`). E.g. `SP26`, `SU26`, `FA25`.
- **`Type`**: **1 to 5 Alphanumericals** (`[A-Z0-9]{1,5}`). E.g. `FE`, `PE1`, `RE`, `B5FE`.
- **`ExamCode`**: **6 Numericals** (`\d{6}$`). E.g. `915637`, `887674`, `312264`. Positioned strictly at **END**.

---

## 3. Pending Features & Nice-To-Haves (Roadmap)

### A. SavedTab Tokenized Search & Filter (Nice-to-Have)
- Search/filter input in `SavedTab` header to filter cached exams by subject code, term, or title.

### B. Catalog Route & Bulk Extraction Mechanism (Under Investigation)
- **Route Support**: `/home` and `/subjects/[subjectCode]`.
- **Server Component Stream (`text/x-component`)**:
  - `GET /home?_rsc=...`: Returns initial 20 `initialProducts`.
  - `POST /home` (Server Action): Paginates remaining products in `initialProducts` list.
  - `GET /home/subject/[code]?_rsc=...`: Returns catalog filtered by course.
- **Bulk Extraction Mechanism**:
  - Content script detects catalog route `/home` or `/subjects/[code]`.
  - Parses `initialProducts` array to retrieve list of product IDs and metadata.
  - Enables user to click "Batch Extract All" to fetch question payloads for all items in the catalog.

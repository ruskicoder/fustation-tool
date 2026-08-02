# Comprehensive Log of Issues & Platform Architectural Findings: `fustation-tool`

> **Document Status**: Live Technical Audit & Issues Register  
> **Target System**: `fustation-tool` Chromium Browser Extension (Manifest V3, React 18, TypeScript, Vite)  
> **Target Web Platform**: `fustation.net` (Next.js App Router, RSC Stream Engine)

---

## Executive Summary

Following recent platform updates on `fustation.net`, the extension's core parsing engine experienced breaking failures in extracting exam question sets via Next.js React Server Component (RSC) stream chunks (`self.__next_f.push`). Deep inspection of webfetches in `docs/webfetches/` and investigation scripts in `/scratch` revealed multiple structural vulnerabilities in payload extraction, DOM crawler selectors, schema handling, and exam code tokenization.

Additionally, user feedback identified core UI/UX enhancements required in the extension's `ExtractTab`, `SavedTab`, and header controls.

This document unifies **ALL ISSUES** identified across previous sessions and current deep-scan investigations.

---

## I. Critical Parsing & RSC Extraction Issues (New & Ongoing)

### [ISSUE-01] Fragile RSC Chunk JSON Extraction (`unescapeNextFChunk`)
- **Status**: 🔴 **CRITICAL - BREAKING**
- **Symptom**: `extractExamFromScripts()` fails to parse exam datasets on newly updated `fustation.net` exam pages, triggering fallback or empty extractions.
- **Root Cause**:
  1. `unescapeNextFChunk()` hardcodes `const dataIdx = unescaped.indexOf('{"productId":');`. If Next.js RSC payload rearranges keys (e.g. `initialData` appears before `productId`, or `productId` is omitted at top level), `indexOf` returns `-1`.
  2. Next.js RSC stream chunks prepend chunk references such as `d:["$","$L17",null,{"productId":...}]`. Naive JSON parsing starting at `{"productId":` assumes single contiguous inline JSON, breaking when RSC chunks use reference pointers (`$18`, `$19`).
  3. Quotes within `self.__next_f.push([1, "..."])` use double-escaped strings (`\"` and `\\\"`) which are stripped incorrectly by single-pass regex string replaces.
- **Remediation**:
  - Implement regex pattern matching targeting `"initialData"\s*:\s*\{` directly instead of key-order dependent `{"productId":`.
  - Fallback to recursive JSON object balanced-brace parser (`tryParsePartialJson`) anchored at `"initialData":`.

### [ISSUE-02] Hardcoded DOM Crawler Selectors (`crawlExamFromDOM`)
- **Status**: 🔴 **CRITICAL - BREAKING**
- **Symptom**: Step-by-step interactive DOM Crawler fails when Next.js RSC fallback is triggered.
- **Root Cause**:
  1. `crawlExamFromDOM()` relies on brittle Tailwind layout classes (`div.w-3\/4`, `div.space-y-2\.5 button`). UI design updates changed container class names to dynamic flex/grid wrappers.
  2. Question counter parsing `Câu hỏi X / Y` fails if DOM layout changes paragraph tags or uses custom span/badge counters.
  3. Study mode toggle `#study-mode-toggle` check fails if element ID is renamed or converted to button component without `#study-mode-toggle`.
- **Remediation**:
  - Update DOM selector strategy to use semantic attributes (`[data-slot="card"]`, `h2`, `button[role="radio"]`, `button:has(svg)`).
  - Implement multi-selector fallback chain for question text, option containers, and Next ("Sau") navigation buttons.

### [ISSUE-03] Next.js `$D` ISO Date Prefix & Date Formatting
- **Status**: 🟠 **MODERATE**
- **Symptom**: Date strings extracted from RSC stream contain Next.js serializing prefix `"$D"` (e.g. `"$D2026-06-28T13:56:23.264Z"`), rendering raw `$D...` strings in UI and export files.
- **Root Cause**: Next.js App Router RSC serializes `Date` objects with a `$D` prefix string.
- **Remediation**:
  - Create date utility `sanitizeRscDate(str: string): string` to strip `$D` prefix.
  - Format dates consistently to standard display format (`DD/MM/YYYY` or `HH:mm | DD/MM/YYYY`) with `"N/A"` fallback.

### [ISSUE-04] Raw HTML Entity & Double-Escaped Quote Pollution
- **Status**: 🟠 **MODERATE**
- **Symptom**: Option text and question text retain raw HTML entities (e.g. `&amp;`, `&quot;`, `&#x27;`, `&lt;`, `&gt;`) and double-escaped quote backslashes (`\"`).
- **Root Cause**: Text content in RSC stream payload is pre-encoded for HTML safety.
- **Remediation**:
  - Add HTML entity decoder utility `decodeHtmlEntities(text: string): string` utilizing `DOMParser` or standard lookup dictionary in `sanitizeOptionText()`.

---

## II. Schema & Domain Model Issues

### [ISSUE-05] `ExamDataset` Schema Incompleteness
- **Status**: 🟠 **MODERATE**
- **Symptom**: Missing metadata fields required for detailed UI display, Markdown export headers, and PDF cover details.
- **Root Cause**: Current `ExamDataset` interface in `src/types/index.ts` only contains basic fields (`id`, `title`, `subjectCode`, `subjectName`, `author`, `totalQuestions`, `questions`).
- **Required Fields to Add**:
  - `campus`: Campus name or code (e.g. `"FPTU Hà Nội"`, `"HOLOLA"`)
  - `examType`: Exam category type (`"FE"` | `"PE"` | `"RE"`)
  - `examSessionTime`: Time slot (e.g. `"09:10"`)
  - `examSessionDate`: Exam date string
  - `parsedTitle`: Clean human-readable exam title string
- **Constraint**: Strictly exclude `price` and `seller` profile data per domain privacy rules.

### [ISSUE-06] Naive Exam Code Parsing (`title.split('_')[0]`)
- **Status**: 🟠 **MODERATE**
- **Symptom**: Non-standard titles or custom mock tests fail to parse subject code or term correctly when using simple string splitting.
- **Root Cause**: `title.split('_')[0]` fails when exam code string format departs from single underscore delimitation.
- **Tokenized Spec**:
  ```
  [SubjectCode]_[Term]_[Type]_[ExamCode]
  ```
  - `SubjectCode`: Strictly `^[A-Z]{3}\d{3}[A-Za-z]{0,2}` (e.g. `MLN122`, `DBM302m`, `WED201C`, `SWE202C`). Positioned strictly at **START**.
  - `Term`: `[A-Z]{2}\d{2}` (e.g. `SP26`, `SU26`, `FA25`).
  - `Type`: `[A-Z0-9]{1,5}` (e.g. `FE`, `PE1`, `RE`, `B5FE`).
  - `ExamCode`: Strictly `\d{6}$` (e.g. `915637`, `887674`, `312264`). Positioned strictly at **END**.
- **Remediation**: Replace string split with tokenized regex parser `parseExamCode(title: string)` in `src/utils/parser.ts`.

---

## III. Export & Format Compiler Issues

### [ISSUE-07] Incomplete Markdown & PDF Exporter Metadata Headers
- **Status**: 🟡 **NICE-TO-HAVE**
- **Symptom**: Compiled Markdown files and PDF print documents omit Campus, Term, and Exam Session details in the `# [info]` header block.
- **Remediation**:
  - Update `compileMarkdown()` in `src/utils/compiler.ts` to include:
    ```markdown
    # [info]
    Campus: FPTU Hà Nội
    Subject: MLN122 - Triết học Mác - Lênin
    Term: SP26 | Type: Đề thi FE
    Session: 09:10 | 29/04/2026
    Total Questions: 60
    ```
  - Update `generatePrintHtml()` in `src/utils/exporter.ts` with matching printable CSS header layout.

---

## IV. UI Layout & State Management Issues

### [ISSUE-08] Panel Dimensions & Layout Shift Prevention
- **Status**: 🟢 **RESOLVED & LOCKED**
- **Specification**:
  - Container `.fus-panel` locked at **`580px` width × `290px` height** (strict 2:1 fixed aspect ratio).
  - Status pill `.fus-status-pill` locked at `width: 140px; min-width: 140px;` to guarantee zero pixel layout shifts during state transitions (`Ready`, `Fetching (X/Y)...`, `Saved`, `Error`).

### [ISSUE-09] Separate "Save" vs "Download" Business Logic
- **Status**: 🟢 **RESOLVED & LOCKED**
- **Specification**:
  - `[ Save ]` caches extracted `ExamDataset` directly to `chrome.storage.local` without triggering file downloads or browser print dialogs.
  - `[ Download ]` exports dataset in the active selected format (`MD` | `PDF` | `JSON`).

### [ISSUE-10] Saved Tab Sticky Toolbar & Danger Action
- **Status**: 🟢 **RESOLVED & LOCKED**
- **Specification**:
  - Top header toolbar `.fus-saved-header-sticky` remains fixed at top of tab container.
  - `[ Clear all ]` button styled with red danger button class `.fus-btn-danger`.

---

## V. Newly Reported UI / UX Issues

### [ISSUE-13] ExtractTab ExamSet Badges / Metadata Display Layout
- **Status**: 🔴 **OPEN - NEEDS USER SELECTION**
- **Symptom**: Current left panel layout in `ExtractTab.tsx` renders incomplete metadata:
  ```
  [subjectcode][Campus]
  [subjectname]
  [examcode]
  [questions no.] Questions
  ```
- **Problem**: Missing critical metadata badges: Exam Type (`Đề thi FE`), Term (`SP26`), Exam Session (`09:10 | 29/04/2026`).
- **Options for Layout**:
  - **Option A (Multi-Row Badges + Stack)**:
    - Row 1: `[Subject Code]` `[Campus]` `[Exam Type]`
    - Row 2: `[Term]` `[Session Date/Time]`
    - Title: Full Subject Name
    - Code: Exam Code String
    - Counter: `X Questions`
  - **Option B (Grid Card Layout)**:
    - Top: Subject Code & Exam Type Badges
    - Middle: Subject Name & Session Badge
    - Bottom: Campus, Term, Code, and Question Count
- **Remediation**: Align on expected layout with user and update `ExtractTab.tsx` and `overlay.css`.

### [ISSUE-14] SavedTab Per-Item Delete Button Missing
- **Status**: 🔴 **OPEN - PENDING IMPLEMENTATION**
- **Symptom**: Saved item rows in `SavedTab.tsx` only have a Download button. When faulty or draft datasets are extracted during testing, users are forced to click `Clear all` (wiping all saved items).
- **Remediation**:
  - Add per-item Delete button `<button className="fus-ctrl-btn fus-btn-danger-icon" title="Delete item">` next to Download button.
  - Required button order: `[ Delete ]` `[ Download ]`.
  - Connect to `deleteExamFromStorage(item.id, callback)`.

### [ISSUE-15] Redundant Header Controls (Excessive Close/Minimize Buttons)
- **Status**: 🔴 **OPEN - PENDING IMPLEMENTATION**
- **Symptom**: Top-right header control in `src/components/Overlay.tsx` has both a Minimize button (`–`) and a Close button (`×`). Both execute `setIsExpanded(false)`.
- **Remediation**: Remove the `×` (Close) button, keeping only the `–` (Minimize) button.

### [ISSUE-16] In-Extension Saved ExamSet Viewing / Preview Mode
- **Status**: 🔴 **OPEN - NEEDS DESIGN DISCUSSION**
- **Symptom**: Saved examsets in `SavedTab.tsx` cannot be inspected or viewed directly within the extension overlay. Users must export/download to read questions.
- **Options for Viewing**:
  - **Option A (Expandable Accordion Row)**: Click item row to expand inline question preview list inside `SavedTab`.
  - **Option B (Full Preview Sub-View)**: Add a `[ View ]` button next to `[ Delete ]` `[ Download ]` that opens a scrollable preview modal or temporary tab view inside the overlay.
  - **Option C (Quick Info Popover)**: Hover or click info icon to show question list preview popup.

---

## VI. Storage Cache Normalization

### [ISSUE-11] Storage Cache Schema Backward-Compatibility
- **Status**: 🟠 **MODERATE**
- **Symptom**: Pre-existing exam items saved in `chrome.storage.local` before schema updates lack newly added fields (`campus`, `examType`, `examSessionTime`, `examSessionDate`).
- **Remediation**: Implement `normalizeSavedDataset(dataset: any): ExamDataset` in `src/utils/storage.ts` to populate default fallbacks for legacy cached items.

---

## VII. Catalog Discovery & Bulk Extraction Roadmap

### [ISSUE-12] Catalog Discovery & Server Action Pagination
- **Status**: 🔵 **FUTURE ROADMAP**
- **Routes**: `/home` and `/subjects/[subjectCode]`
- **Mechanism**:
  - Parse `initialProducts` array from catalog page RSC stream.
  - Intercept POST Server Action requests to fetch full product list for batch extraction.

---

## Summary Matrix of Issues & Actions

| Issue ID | Category | Description | Status | Target File |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-01** | RSC Extraction | Fragile `{"productId":` string matching & escaped RSC chunks | 🔴 Breaking | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-02** | DOM Crawler | Hardcoded Tailwind class selectors fail on UI updates | 🔴 Breaking | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-03** | RSC Parser | Next.js `$D` ISO date prefix in date strings | 🟠 Moderate | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-04** | Parser | HTML entity decoding & quote sanitization | 🟠 Moderate | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-05** | Schema | Extend `ExamDataset` (`campus`, `examType`, `sessionTime`, etc.) | 🟠 Moderate | [src/types/index.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/types/index.ts) |
| **ISSUE-06** | Exam Code | Tokenized regex parser `[Subject]_[Term]_[Type]_[Code]` | 🟠 Moderate | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-07** | Exporter | Enhanced `# [info]` block for Markdown & PDF cover | 🟡 Nice-to-Have | [src/utils/compiler.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/compiler.ts) |
| **ISSUE-08** | UI Layout | Locked 2:1 aspect ratio (580x290) & 140px status pill | 🟢 Resolved | [src/styles/overlay.css](file:///mnt/DATA/DATA/Github/fustation-tool/src/styles/overlay.css) |
| **ISSUE-09** | Business Logic | Separated Save vs Download action stack | 🟢 Resolved | [src/components/ExtractTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/ExtractTab.tsx) |
| **ISSUE-10** | UI Component | Saved Tab sticky header & red clear-all button | 🟢 Resolved | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |
| **ISSUE-11** | Storage | Storage cache normalization for legacy cached datasets | 🟠 Moderate | [src/utils/storage.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/storage.ts) |
| **ISSUE-12** | Catalog | Catalog route `initialProducts` batch extraction | 🔵 Roadmap | [src/utils/parser.ts](file:///mnt/DATA/DATA/Github/fustation-tool/src/utils/parser.ts) |
| **ISSUE-13** | UI Layout | ExtractTab ExamSet Badges / Metadata Layout Options | 🔴 Open | [src/components/ExtractTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/ExtractTab.tsx) |
| **ISSUE-14** | UI Action | SavedTab per-item Delete button `[Delete][Download]` | 🔴 Open | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |
| **ISSUE-15** | Header UI | Remove redundant Close button (`×`), keep Minimize (`–`) | 🔴 Open | [src/components/Overlay.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/Overlay.tsx) |
| **ISSUE-16** | Feature | In-Extension Saved ExamSet Viewing / Preview Mode | 🔴 Open | [src/components/SavedTab.tsx](file:///mnt/DATA/DATA/Github/fustation-tool/src/components/SavedTab.tsx) |

---

*Log compiled and verified in accordance with `/docs/web-architecture.md` and `/docs/extension-requirements.md`.*

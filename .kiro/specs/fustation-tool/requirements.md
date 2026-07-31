# Requirements Document: fustation-tool

## Introduction

`fustation-tool` is a Manifest V3 Chromium Extension developed using **TypeScript and React (React TS)**, compiled into a production `/dist` directory via Vite. It extracts exam question banks from `fustation.net` into offline Markdown (`.md`), PDF documents, and JSON datasets.

---

## Requirements

### Requirement 1: Next.js RSC Data Extraction & Fallback Fetch
**User Story:** As a student, I want the extension to extract questions automatically and provide a manual fetch button, so that I never lose any questions if auto-extraction misses items.

#### Acceptance Criteria
1. WHEN an exam page (`/marketplace/exam/[id]`) is loaded THEN the React TS content script SHALL parse `self.__next_f` inline script tags to locate `initialData.questions`.
2. WHEN the user clicks "Fetch" THEN the system SHALL manually re-scan script payloads and DOM elements to retrieve missing items.

### Requirement 2: Universal Export Format Switcher (`MD`, `PDF`, `JSON`)
**User Story:** As a student, I want a single format switcher so that I can easily export or download exams in Markdown, PDF, or JSON format.

#### Acceptance Criteria
1. THEN the extension UI SHALL feature a React TS Segmented Control (`role="radiogroup"` containing `role="radio"` items with `aria-checked` states and keyboard arrow-key navigation).
2. THEN the segmented control SHALL display 3 options in exact order: `MD` | `PDF` | `JSON`.
3. IF `MD` is selected THEN downloads SHALL export Markdown formatted with `[info]` headers and question blocks.
4. IF `PDF` is selected THEN downloads SHALL trigger a print window with `@media print` styles and `window.print()`.
5. IF `JSON` is selected THEN downloads SHALL export raw structured JSON datasets.
6. THEN exported filenames SHALL follow `{SubjectCode}_{ExamID}.{ext}`.

### Requirement 3: Overlay UI Layout & Focus Ring Accessibility
**User Story:** As a user, I want a clean overlay layout with accessible focus states, so that I can easily navigate via mouse or keyboard.

#### Acceptance Criteria
1. WHILE viewing `fustation.net` THEN the system SHALL render a fixed Floating Action Button (FAB) at bottom-right.
2. THEN the panel header SHALL render `fustation-tool v1.0.0`.
3. THEN the left panel of the expanded overlay SHALL display Subject Badge, Subject Name, Campus Badge, Exam Code (`[examcode]_[term]_[Code]_[6-digit-numeric]`), and Total Questions Count without metric boxes.
4. THEN the right panel SHALL house the Format Switcher centered at top, and `[ Fetch ]` | `[ Download ]` buttons below.
5. THEN the Saved tab header SHALL display `Saved Exams (X)` | `Export format: [ MD | PDF | JSON ]` | `[ Clear all ]`.
6. THEN interactive buttons SHALL render high-contrast `:focus-visible` offset rings.

### Requirement 4: Build Architecture
**User Story:** As a developer, I want all TypeScript and React source files bundled cleanly into a single `/dist` directory, so that the extension follows standard build conventions.

#### Acceptance Criteria
1. WHEN running `npm run build` THEN the system SHALL compile all `.ts` and `.tsx` source files into `/dist`.
2. THEN the `/dist` directory SHALL contain `manifest.json`, bundled content scripts, service worker, and CSS assets ready to load unpacked in Chrome.

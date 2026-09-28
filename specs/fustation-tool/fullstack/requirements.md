# Requirements Document: fustation-tool

## Introduction

`fustation-tool` is a Manifest V3 Chromium extension written in TypeScript and React 18 and bundled by Vite into `/dist`. It extracts exam question banks (FE) and practical exam assets (PE) from `fustation.net`, caches them in `chrome.storage.local`, and exports them for offline study as Markdown, PDF, JSON, or ZIP, one exam at a time or in bulk.

System context and domain entities: `docs/00-system-context.md`. Layering: `docs/01-architecture-conventions.md`. Pipeline and endpoints: `docs/02-backend-conventions.md`. UI rules: `docs/03-frontend-conventions.md`.

Last reconciled with code: 2026-09-28 (branch `features/Design_SSOT_Scaffold`).

## Requirements

### Requirement 1: Exam Page Recognition & RSC Extraction
**User Story:** As a student, I want the extension to extract every question of the exam I am viewing, so that I do not have to copy questions one by one.

#### Acceptance Criteria
1. WHEN a page matching `/marketplace/exam/{cuid}` or `/marketplace/{cuid}` loads THEN the content script SHALL classify it as an exam route and extract the exam id.
2. IF the path segment is `exam`, starts with `layout-`, or is not a product id THEN the system SHALL NOT treat the page as an exam route.
3. WHEN an exam route is active THEN the system SHALL parse `self.__next_f` RSC chunks for `initialData` and normalize it into an `ExamDataset`.
4. WHILE RSC chunks are still streaming THEN the system SHALL retry the parse every 300 ms up to 10 times.
5. IF all retries fail THEN the system SHALL reload the page at most once per exam URL and, if that also fails, show an error status and toast.
6. WHEN the SPA navigates between routes THEN the system SHALL re-run classification and extraction without a full reload.
7. WHEN RSC string chunks contain escaped `\n` THEN the parser SHALL keep them escaped until `JSON.parse` succeeds.
8. WHEN a value is an RSC text reference (`$<id>`) THEN the parser SHALL resolve it from the `<id>:T<hex byte length>,` row using UTF-8 byte lengths.
9. WHEN a value is the RSC sentinel `"$undefined"` THEN the system SHALL treat it as absent.
10. IF an exam page has no inline exam payload and no PE asset link THEN extraction SHALL fail so the guarded reload runs, rather than produce an empty PE dataset.

### Requirement 2: Exam Metadata Parsing
**User Story:** As a student, I want exam files labelled with subject, term, type, and session, so that my offline library stays organized.

#### Acceptance Criteria
1. WHEN a title follows `[SubjectCode]_[Term]_[Type]_[ExamCode]` THEN the system SHALL parse `SubjectCode` from the start (`^[A-Z]{3}\d{3}[A-Za-z]{0,2}`) and `ExamCode` from the end (`\d{6}$`).
2. WHEN RSC dates carry the `$D` prefix THEN the system SHALL strip it before formatting.
3. WHEN text contains HTML entities or double-escaped quotes THEN the system SHALL decode them before display and export.
4. IF a field is absent in the payload THEN the system SHALL leave it empty rather than insert dummy placeholder values.

### Requirement 3: PE (Practical Exam) Assets
**User Story:** As a student, I want the PE paper and answer-key ZIP, so that I can practise practical exams offline.

#### Acceptance Criteria
1. WHEN the exam type or title marks a PE set THEN the system SHALL classify it as `examCategory: 'PE'` and resolve `pdfUrl` and `zipUrl`.
2. WHEN the PDF is requested THEN the system SHALL use `/api/exams/pdf?productId={id}` only with a valid numeric id or CUID, never a 6-digit title suffix.
3. IF a presigned ZIP URL returns HTTP 403 THEN the system SHALL fetch a fresh URL from the RSC endpoint and retry with backoff.
6. WHEN any PE answer-key ZIP is downloaded (single `PE_ZIP`, `PE_BOTH`, viewer button, bulk) THEN the system SHALL first request a fresh presigned URL from the RSC endpoint and SHALL use the stored `zipUrl` only if that request yields none.
7. WHEN an asset URL is not on the fustation.net origin THEN the content script SHALL fetch it through the service worker, which holds the S3 host permission and sends no cookies.
8. IF an asset cannot be fetched THEN the system SHALL return `false`, show an error toast, and mark the asset `Missing` in `manifest.md`; it SHALL NOT fall back to a cross-origin `<a download>` or report success.
9. WHEN a download is started from an object URL THEN the system SHALL revoke that URL no sooner than 60 seconds later, and SHALL NOT store asset bytes in `chrome.storage.local`.
4. WHEN a PE set is previewed THEN the viewer SHALL show the PDF full-height with a debounced search input.
5. WHEN a language Writing set (`_W`, `_RW`) exposes its paper as `initialData.examUrl` THEN the system SHALL treat it as a PDF-only PE set.

### Requirement 4: Math & Image Fidelity
**User Story:** As a student, I want formulas and diagrams preserved, so that exported questions remain readable.

#### Acceptance Criteria
1. WHEN question text contains LaTeX THEN the UI SHALL render it with KaTeX, treating escaped `\$` as a literal dollar sign.
2. WHEN a question image points to S3 THEN the system SHALL route it through `/api/exams/question-image?key=`.
3. WHEN exporting MD, PDF, or JSON THEN images SHALL be embedded as base64 so the file is self-contained.
4. WHEN a network image fetch fails THEN the system SHALL fall back to extracting base64 from the rendered DOM image.
5. IF a `$` cannot open or close a math span (Pandoc rule: opener followed by non-space, closer preceded by non-space and not followed by a digit) THEN the system SHALL keep it as literal text.
6. WHEN a `$$` opener has no `$$` closer but a valid single `$` closer THEN the system SHALL render the span as inline math.

### Requirement 4A: Reading Passages (Language Exams)
**User Story:** As a student, I want the reading passage exported with its questions, so that reading-comprehension exams are usable offline.

#### Acceptance Criteria
1. WHEN `initialData.readingPassages` is present THEN the system SHALL store each passage with its text, optional image, and `fromQuestion`..`toQuestion` range.
2. WHEN exporting MD or PDF, or viewing a saved exam, THEN each passage SHALL appear once, immediately before the first question of its range.
3. WHEN a saved dataset is normalized THEN its passages SHALL be preserved.

### Requirement 5: Local Library (Saved Exams)
**User Story:** As a student, I want fetched exams saved locally, so that I can view and export them later without revisiting the site.

#### Acceptance Criteria
1. WHEN the user clicks Save, or auto-save fires after a successful fetch, THEN the system SHALL persist the dataset under `fustation_saved_exams` with `unlimitedStorage`.
2. WHEN concurrent saves occur THEN writes SHALL be serialized so no entry is lost.
3. WHEN older cached entries lack newer fields THEN `normalizeSavedDataset` SHALL upgrade them without dropping `examCategory`, `pdfUrl`, or `zipUrl`.
4. THEN the Saved tab SHALL group exams by subject, support search, per-item inspect, delete, download, and a red Clear all.

### Requirement 6: Export Formats
**User Story:** As a student, I want to choose the export format, so that the output suits my study tool.

#### Acceptance Criteria
1. IF `MD` is selected THEN the output SHALL contain an `[info]` header (subject, title, campus, session, type, term, total; no seller or price), `### Question X:` blocks, options, and `Answer: X`.
2. IF `PDF` is selected THEN the system SHALL open a print window with KaTeX and print CSS and call `window.print()`; IF pop-ups are blocked THEN it SHALL download the HTML instead.
3. IF `JSON` is selected THEN the system SHALL export the full dataset.
4. IF a PE format (`PDF`, `ZIP`, `ALL`) is selected THEN the system SHALL download the corresponding assets.
5. THEN filenames SHALL be derived from the parsed exam code and de-duplicated, including inside bulk ZIP volumes.
6. WHEN a question body contains code THEN the Markdown export SHALL fence it verbatim; elsewhere `<` SHALL be escaped outside math and line breaks preserved.
7. THEN exported HTML SHALL render math as MathML so it displays correctly offline without external stylesheets.

### Requirement 7: Batch Discovery & Bulk Export
**User Story:** As a student, I want to fetch and export many exams at once, so that I can archive a whole catalog.

#### Acceptance Criteria
1. WHEN batch mode starts on a catalog page (`/home`, `/subject/...`) THEN the system SHALL discover every unique exam CUID from product data and marketplace links.
2. WHERE preview is enabled THEN the system SHALL fetch the first N exams for review before the full run.
3. WHILE a batch runs THEN the user SHALL be able to pause, resume, and stop, and state SHALL survive extension reloads.
4. WHEN bulk export runs over FE and PE items THEN the system SHALL produce ZIP volumes bounded by byte size, not item count (see 7.8), named `fustation_export_ddmmyyyy.zip` when one volume suffices and `fustation_export_ddmmyyyy_partX.zip` otherwise, foldered by subject, each with a `manifest.md` asset audit that marks every unavailable or unresolvable asset `Missing`.
6. IF a fresh exam payload publishes the PE paper (`/api/exams/pdf` or `examUrl`) but contains no answer-key link, and no stored `zipUrl` exists, THEN the system SHALL mark the ZIP `Not provided` rather than `Missing`, and SHALL NOT list it as a missing detail (ISSUE-104).
7. WHEN an asset request returns a definitive client error (HTTP 4xx other than 403, 408, 429) THEN the system SHALL stop retrying that URL and SHALL record the status.
8. WHEN an exam is added to a bulk volume THEN the system SHALL stage all of its files first; IF the staged exam would push the volume past its byte budget (64 MB per GB of `navigator.deviceMemory`, clamped to 128 to 512 MB) THEN the system SHALL roll the exam back, write the volume, and start the next volume with that exam, so no exam is split across volumes; IF one exam alone exceeds the budget THEN it SHALL be written as its own volume and logged (ISSUE-109).
5. WHILE bulk export runs THEN a slide-up progress footer SHALL show counters, batch index, status, and an expandable log.

### Requirement 8: Overlay UI & Accessibility
**User Story:** As a user, I want a stable, keyboard-accessible overlay, so that it does not disturb the page and works without a mouse.

#### Acceptance Criteria
1. THEN the overlay SHALL be draggable and resizable within the minimum sizes in `docs/03-frontend-conventions.md` section 10.2, and remember geometry, open state, active tab, and theme.
2. THEN status changes SHALL NOT shift layout.
3. THEN the format switcher SHALL be a radiogroup with arrow-key navigation, and every control SHALL show a `:focus-visible` ring.

### Requirement 9: Build & Packaging
**User Story:** As a developer, I want one reproducible build, so that the unpacked extension always matches source.

#### Acceptance Criteria
1. WHEN `npm run build` runs THEN `tsc`, Vite, and `scripts/build.js` SHALL produce `dist/manifest.json`, `dist/content.js`, `dist/background.js`, and `dist/assets/` including KaTeX fonts, then run the fixture test suite.
2. THEN `src/manifest.json` SHALL be the only manifest source and SHALL declare every Chrome API the code uses.

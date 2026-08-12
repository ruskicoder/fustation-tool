# Requirements Document: Batch ZIP Export Engine & Progress UI

## Executive Summary
This document specifies the requirements for the batch-based exam export engine, atomic volume partitioning, dual state machine progress tracking, slide-up footer UI, automated FE image recovery script, homepage multi-pattern catalog endpoint hotfix, and header dual-switcher UI overflow / high-contrast log hotfixes for `fustation-tool`.

---

## Requirements

### Requirement 1: Centralized Batch Configuration
**User Story:** As a developer, I want a single configurable batch size variable, so that future settings UI integrations can adjust volume sizes without refactoring export logic.

#### Acceptance Criteria
1. WHILE initializing export operations THEN the system SHALL reference a central `EXAMSETS_PER_BATCH` configuration variable (default `50`).
2. IF `EXAMSETS_PER_BATCH` is modified THEN the system SHALL recalculate batch partitioning dynamically across single-part and multi-part exports.

---

### Requirement 2: Atomic Batch Partitioning & Memory Management
**User Story:** As a user downloading 100+ exams, I want the export process to run in atomic batches with automatic memory cleanup, so that my browser does not lag or crash from memory leaks.

#### Acceptance Criteria
1. WHEN a bulk download is requested THEN the system SHALL determine the total selected examsets (`selectedCounter`) and calculate total batch count `Y = Math.ceil(selectedCounter / EXAMSETS_PER_BATCH)`.
2. WHEN processing a batch THEN the system SHALL verify that all preceding batches have been downloaded or that it is the initial batch (Batch 0).
3. WHEN a batch completes download THEN the system SHALL immediately dispose of the batch memory structures (clear JSZip buffers and Blob URLs) before compiling the next batch.
4. IF a unrecoverable critical error occurs in an examset during batch compilation THEN the system SHALL exclude the broken examset from the ZIP, record its failure in `manifest.md`, and continue processing remaining examsets atomically.

---

### Requirement 3: Fast Asset Retry & Audit Manifest (`manifest.md`)
**User Story:** As a user, I want transient network failures retried automatically and failed assets documented with direct download links, so that I never get silent asset omissions.

#### Acceptance Criteria
1. WHEN fetching an asset (FE image, PE PDF, PE ZIP) fails THEN the system SHALL retry the fetch at least 3 times with fast backoff delays (< 100ms per retry).
2. IF an asset fails all retry attempts THEN the system SHALL mark the asset status as `Missing` and record its direct download link in `manifest.md`.
3. WHILE compiling any batch ZIP THEN the system SHALL include a root `manifest.md` detailing every examset in the batch, tagged as `[FE]` or `[PE]`, alongside detailed asset availability statuses.

---

### Requirement 4: Dual State Machine & Color Coding
**User Story:** As a user, I want clear, theme-harmonized color feedback on overall progress and individual batch states, so that I can monitor export status at a glance.

#### Acceptance Criteria
1. WHILE in `Standby / Ready` state THEN the system SHALL display theme light-purple status styling.
2. WHILE in `In Progress / Compiling / Downloading` state THEN the system SHALL display theme light-blue status styling.
3. WHEN an asset fetch attempt fails THEN the footer status pill SHALL flash light-red.
4. WHILE an asset fetch is actively retrying THEN the footer status pill SHALL flash light-yellow.
5. WHEN a batch or overall process completes successfully THEN the system SHALL display light-green status styling.
6. WHEN download is initiated THEN the header status pill SHALL transition `Ready` -> `Processing` -> `Done` upon completion of all batches.
7. WHILE an individual batch executes THEN the footer pill SHALL transition `Standby` -> `Compiling` -> `Downloading` -> `Done`.
8. WHEN rendering mixed FE+PE selections in the header THEN the system SHALL adjust header container vertical padding/height (`min-height: 48px`, `height: auto`), ensure all matrix buttons have explicit `touch-action: auto` & `pointer-events: auto` to prevent drag interception, and enforce an ultra-compact fused 3×2 layout (~28px total height) so the lower PE row is fully visible and clickable.

---

### Requirement 5: Responsive Slide-Up Progress Footer UI & Log Contrast
**User Story:** As a user, I want an on-demand footer containing progress metrics, a log drawer anchored above the footer, high-contrast readable log text, and pause/cancel controls, so that I have full oversight and control during downloads.

#### Acceptance Criteria
1. WHEN a download request is triggered (regardless of total item count) THEN the footer SHALL slide up smoothly from the bottom and remain statically anchored to the bottom of the main panel.
2. WHEN all batches complete or download is canceled THEN the footer SHALL slide down and auto-hide.
3. WHILE downloading THEN the Left Cluster SHALL display `[currentExamsetCounter / selectedCounter]` and `[Batch X/Y] [Batch Status Pill]`.
4. WHILE downloading THEN the Middle Cluster SHALL display real-time inline progress logs and an Expand Arrow button to toggle a full log drawer that opens ALWAYS ABOVE the footer.
5. WHEN the user clicks Pause THEN the system SHALL pause atomic batch iteration until resumed.
6. WHEN the user clicks Cancel THEN the system SHALL abort active batch compiling, clean up memory, and slide down the footer.
7. WHILE displaying batch logs in `.fus-batch-log-box` or the footer log drawer THEN the log container SHALL use theme-centric high-contrast surface tokens (`var(--fus-layer-hover)`, `var(--fus-text)`, `var(--fus-border)`) to ensure high readability while adhering to the active theme.

---

### Requirement 6: Automated FE Image Asset Recovery (Python TUI Script with Interactive Standby)
**User Story:** As a user with missing FE image assets in my exported ZIP, I want an interactive Python TUI script that displays direct pre-named download links, stands by for my manual download, and re-embeds Base64 images into HTML files automatically, so that I don't need to manually rename files or edit HTML code.

#### Acceptance Criteria
1. IF any FE question image asset fails all 3 retry attempts THEN the batch ZIP SHALL include an empty folder `reimport-images-here/` and a self-contained Python script `recover_images.py`.
2. WHEN the user launches `recover_images.py` THEN the script TUI SHALL parse `manifest.md`, display overall asset status, and list direct HTTP/HTTPS download URLs with pre-named target filenames embedded in the link parameters (e.g. `batch01-rec-img-1.png`).
3. WHILE in the link display stage THEN the script TUI SHALL STAND BY and prompt the user to download the images into `reimport-images-here/`, waiting for the user to confirm via "I have downloaded the images and placed them into the folder".
4. WHEN confirmed THEN the script TUI SHALL scan `reimport-images-here/`, verify correct file presence and naming, and display a confirmation screen warning "This operation cannot be undone."
5. WHEN accepted THEN the TUI SHALL convert images to Base64 strings, update target HTML `src` attributes inline, and display final metrics (`Success: X/Y, Failed: Z`).
6. WHILE processing PE asset failures THEN the system SHALL list direct download links in `manifest.md` without invoking the Python TUI.

---

### Requirement 7: Homepage Catalog Endpoint & Multi-Pattern Route Parsing Hotfix
**User Story:** As a user navigating the catalog or downloading exams from the homepage, I want `fustation-tool` to recognize all endpoint route variations (`/marketplace/exam/{id}`, `/marketplace/exams/{id}`, `/marketplace/{cuid}`), so that all 350+ catalog exams are discovered and parsed seamlessly.

#### Acceptance Criteria
1. WHILE parsing homepage HTML or RSC script chunks THEN the system SHALL execute multi-pattern regex parsing matching `/marketplace/exam/{id}`, `/marketplace/exams/{id}`, and `/marketplace/{cuid}`.
2. WHEN `initialProducts` is present in RSC script tags THEN the system SHALL extract `initialProducts` metadata and continue scanning raw HTML/RSC content without terminating early.
3. WHEN evaluating browser pathnames in `classifyRoute` THEN the system SHALL recognize `/marketplace/exam/{id}`, `/marketplace/exams/{id}`, and `/marketplace/{cuid}` as valid exam routes.

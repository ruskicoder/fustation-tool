# Implementation Plan: Batch ZIP Export Engine & Progress UI

## Major Implementation Phases

- [x] 1. Phase 1: Configuration & Data Architecture Foundation
  - [x] 1.1 Add central batch configuration constants in `src/config/constants.ts` or `src/utils/exporter.ts`
    - Define `EXAMSETS_PER_BATCH = 50`, `ASSET_RETRY_ATTEMPTS = 3`, and `ASSET_RETRY_DELAY_MS = 80`
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Update export types & progress interfaces in `src/types/index.ts`
    - Define `BatchStatus`, `BatchProgressState`, dual state machine models, and progress callback signatures
    - _Requirements: 2.1, 4.7_

- [x] 2. Phase 2: Fast Network Fetcher, Asset Retry Engine & Universal Manifest Generator
  - [x] 2.1 Implement `fetchArrayBufferWithFastRetry` in `src/utils/exporter.ts`
    - Build 3-attempt retry loop with fast <100ms backoff delays
    - Add status callbacks for `retrying` and `failed` events to feed state machine color flashes
    - _Requirements: 3.1, 4.3, 4.4_
  - [x] 2.2 Build Universal `manifest.md` generator in `src/utils/exporter.ts`
    - Generate structured Markdown auditing `[FE]` and `[PE]` examsets, asset statuses, and direct download links
    - Include target pre-named image filenames (`batchXX-rec-img-N.png`) in download links for missing FE images
    - _Requirements: 3.2, 3.3, 6.2_
  - [x] 2.3 Create Python TUI Recovery Script generator (`recover_images.py`)
    - Build standalone Python TUI script template that displays pre-named direct links, STANDS BY until user confirms ("I have downloaded the images..."), scans `reimport-images-here/`, displays confirmation screen ("Cannot be undone"), converts images to Base64, and updates HTML files inline
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Phase 3: Atomic Batch Processing & Memory Lifecycle Engine
  - [x] 3.1 Implement atomic batch loop & memory disposal in `exportBulkAsZip`
    - Partition selected examsets into 50-item batches
    - Verify previous batch completion before starting next batch
    - Include `reimport-images-here/` folder and `recover_images.py` if missing FE images exist
    - Invoke batch ZIP download and immediately clear JSZip instance and Blob URL references after each volume download
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_
  - [x] 3.2 Implement Pause/Cancel state machine controls in `exportBulkAsZip`
    - Support pausing batch processing loop and aborting execution on cancel signal
    - _Requirements: 5.5, 5.6_

- [x] 4. Phase 4: Slide-Up Progress Footer UI, Log Drawer Component & UI Hotfixes
  - [x] 4.1 Build `src/components/ProgressFooter.tsx` UI component
    - Implement Left Cluster (`[Counter/Total]`, `[Batch X/Y] [Status Pill]`), Middle Cluster (Inline note & Expand Log drawer button), Right Cluster (Pause/Cancel buttons)
    - Position expandable log drawer ALWAYS ABOVE the footer bar (`bottom: footerHeight`)
    - Apply theme-based color styling for Standby (purple), Compiling (blue), Flashing Red (failed attempt), Flashing Yellow (retrying), Downloading (blue), and Done (green)
    - _Requirements: 4.1, 4.2, 4.5, 4.7, 5.1, 5.3, 5.4, 5.5, 5.6_
  - [x] 4.2 Create slide-up CSS animations & responsive styles in `src/styles/main.css` / `overlay.css`
    - Support smooth slide-up transition on download start and slide-down on completion
    - Statically anchor footer bar to bottom of main panel (`bottom: 0`, `z-index: 100`)
    - _Requirements: 5.1, 5.2_
  - [x] 4.3 UI Hotfixes: Theme-centric high-contrast log box (`.fus-batch-log-box`) & Header matrix interaction/clipping fix
    - Update `.fus-batch-log-box` and log drawer styling to theme-centric high-contrast surface tokens (`var(--fus-layer-hover)`, `var(--fus-text)`, `var(--fus-border)`) to ensure stark readability while adhering to active theme styling
    - Update `.fus-header` CSS (`height: auto`, `min-height: 48px`, `padding: 6px 10px 6px 12px`) and add `.fus-header .fus-format-matrix { touch-action: auto !important; pointer-events: auto !important; }` to ensure PE buttons are fully unclipped and clickable
    - Ultra-compact `.fus-matrix-grid-row` styling (~26px total height, `font-size: 8px`, `padding: 0px 1px`) to prevent overflow inside header
    - _Requirements: 4.8, 5.7_

- [x] 5. Phase 5: Integration & Controller Wiring
  - [x] 5.1 Connect `ProgressFooter` state to `Overlay.tsx` & `SavedTab.tsx`
    - Wire `handleBatchDownload` to pass real-time progress callbacks to `exportBulkAsZip`
    - Update Header Status Pill to transition `Ready` -> `Processing` -> `Done`
    - _Requirements: 4.6, 5.1, 5.2_
  - [x] 5.2 Validate end-to-end atomic batch export workflow
    - Verify 50-item volume partitioning, `manifest.md` audit, TUI script generation, progress footer animations, theme-centric high-contrast log contrast, header layout, and memory cleanup
    - _Requirements: 1.1 - 7.3_

- [x] 6. Phase 6: Hotfix — Homepage Catalog Multi-Pattern Endpoint Parser
  - [x] 6.1 Refactor `extractProductTasksFromHtml` in `src/utils/batchFetcher.ts`
    - Run Pass 2 multi-pattern regex matching (`/marketplace/exam/{id}`, `/marketplace/exams/{id}`, `/marketplace/{cuid}`) unconditionally, combining `initialProducts` metadata with full HTML regex discoveries to extract all 350+ catalog exams
    - _Requirements: 7.1, 7.2_
  - [x] 6.2 Update `classifyRoute` in `src/components/Overlay.tsx`
    - Support route classification for `/marketplace/exam/{id}`, `/marketplace/exams/{id}`, and `/marketplace/{cuid}`
    - _Requirements: 7.3_
  - [x] 6.3 Update `scratch/test-flow.ts` integration assertion
    - Assert discovery of >= 300 catalog items on `hompage-fullfetch.html`
    - _Requirements: 7.1, 7.2_

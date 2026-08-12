# Executive Summary & Findings Overview

## Topic
Downloading 100+ examsets lags the browser and causes empty or incomplete ZIP files due to single-attempt network fetches, unthrottled JSZip buffer accumulation, and lack of visual progress feedback.

## Findings Directory
`/mnt/DATA/DATA/Github/fustation-tool/.agent-research/download-zip-batch-progress-20260810`

## Key Investigation Highlights
1. **Codebase Bottleneck (`src/utils/exporter.ts`)**:
   - `exportBulkAsZip` processes all items into a single monolithic JSZip instance without yielding to the event loop.
   - `fetchArrayBuffer` uses single-try `fetch` without retries, silently returning `null` on transient network errors, leading to missing PDFs or ZIP answer keys.
2. **UI Limitation (`src/components/SavedTab.tsx` / `Overlay.tsx`)**:
   - Batch downloads have no progress bar or slide-up status container to indicate zipping progress.

## Proposed Solution (Approach A)
- **Volume Partitioning**: Single ZIP file for ≤50 items (`fustation_export_[DDMMYYYY].zip`). Sequential volume archives (`_part1.zip`, `_part2.zip`, etc.) for >50 items.
- **Universal Audit Manifest (`manifest.md`)**: Embedded at the root of EVERY exported ZIP volume, listing all [FE] and [PE] examsets with asset status and direct inline fallback links for missing items.
- **3-Attempt Network Retry & Non-Blocking Loops**: `fetchArrayBufferWithRetry` with 500ms backoff and `setTimeout` pauses between items.
- **Slide-Up Progress Footer**: An on-demand status footer that slides up from the bottom of the Saved tab during zipping, showing progress bar, volume count, and item title.

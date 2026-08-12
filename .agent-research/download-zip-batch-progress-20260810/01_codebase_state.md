# Current Codebase State Analysis: Bulk Zip Export & Progress UI

## Executive Summary
This document records the exact state of the `fustation-tool` codebase regarding batch zip exporting, network fetching, asset aggregation, and user interface feedback during bulk downloads.

---

## 1. Exporter Engine (`src/utils/exporter.ts`)

### `exportBulkAsZip` (Lines 264–323)
- **Single-Zip Accumulation**: Iterates sequentially through `savedItems` in a single loop and appends all items into a single `JSZip` instance regardless of item count (`zip.folder(subjCode).file(...)`).
- **Memory & Event-Loop Stalls**: When exporting 100+ exams, JSZip holds all array buffers (PDFs, ZIP answer keys, Base64 embedded images) in RAM simultaneously. `zip.generateAsync({ type: 'blob' })` (Line 317) runs heavy compression on the giant buffer, blocking the main browser thread and freezing the UI.
- **No Event Loop Pausing**: Execution progresses continuously from item to item without yielding to the browser event loop (`setTimeout` or `requestAnimationFrame`), contributing to page freezing during large operations.

### `fetchArrayBuffer` (Lines 27–42)
- **Single-Attempt Fetching**: Executes a single `fetch(fullUrl, { credentials: 'include' })` call.
- **Silent Failures**: If a network request fails (e.g. 404, temporary network drop, rate limit), `catch` returns `null` (Line 39–41).
- **Missing File Corruption**: `if (pdfBuf)` check (Line 290) silently skips adding the file to the zip when `pdfBuf` is `null`. As a result, exported zip archives end up missing PDFs/ZIPs or become empty without notifying the user.

### Asset Export Logic
- **Practical Exams (PE)** (Lines 281–299): Fetches `pdfUrl` and `zipUrl` via `fetchArrayBuffer`.
- **Full Exams (FE)** (Lines 300–314): Calls `embedBase64ImagesInDataset(ds)` which fetches question images as Base64 data URLs. Missing images result in missing Base64 or skipped assets.

---

## 2. Saved Items & UI Controller (`src/components/SavedTab.tsx` & `src/components/Overlay.tsx`)

### `SavedTab.tsx` (Lines 176–193, 260–267)
- **Batch Download Trigger**: Multi-item export is triggered via `onBatchDownload` in the sticky toolbar or `onExportFolder` on folder headers.
- **Lack of Visual Progress Indicator**: There is no progress bar, item counter, or state indicator during zip generation. The UI only displays a general status pill (`Downloading...`) in the header, giving no feedback on item progress (e.g. "Processing 12/100").

### `Overlay.tsx` (Lines 433–456, 493–505)
- `handleBatchDownload`: Sets state `setStatus('downloading')` and invokes `exportBulkAsZip(selectedItems, feFormat, peFormat)`.
- `handleExportFolder`: Sets `setStatus('downloading')` and calls `exportBulkAsZip`.
- **Missing Callback Intercepts**: `exportBulkAsZip` receives no progress callback or chunk state callback from `Overlay.tsx`.

---

## 3. Data Types & Models (`src/types/index.ts`)
- Defines `SavedExamItem`, `ExamDataset`, `FEFormat` ('MD' | 'PDF' | 'JSON'), `PEFormat` ('PE_PDF' | 'PE_ZIP' | 'PE_BOTH').
- `StatusState` includes `'ready' | 'fetching' | 'batch_fetching' | 'autosaving' | 'processing' | 'downloading' | 'extracted' | 'error'`.

# Security, Safety, and Code Quality Audit Notes

## 1. Network & Credential Security
- **Credentials Handling**: All `fetchArrayBuffer` calls use `{ credentials: 'include' }` to preserve session cookies when requesting exam PDFs or answer key ZIP files from `https://www.fustation.net`.
- **Sanitizing Inline URLs**: URLs recorded in `manifest.md` for missing assets must be validated and sanitized to prevent Markdown link injection or trailing control character corruption.

## 2. Memory & Extension Thread Safety
- **Blob Object URL Leakage**: `URL.revokeObjectURL(url)` must be called after triggering each volume download to prevent memory leaks in long-running tab sessions.
- **Sanitizing Archive File Paths**: Exam titles and subject codes included in zip folder paths must continue to strip unsafe path characters (`/[^a-zA-Z0-9_-]/g`) to prevent zip slip or invalid filename errors in client operating systems.

## 3. Code Quality Observations
- Current `exporter.ts` has single-attempt fetch logic without progress callback hooks. Adding optional `onProgress?: (progress: ExportProgress) => void` parameters to `exportBulkAsZip` decouples exporter logic from React UI state cleanly.

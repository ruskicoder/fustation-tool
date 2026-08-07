# Current Progress — fustation-tool

**Last Updated**: 2026-08-07
**Status**: 🟢 **ALL ACTIVE ISSUES RESOLVED (ISSUES 68 THROUGH 75 COMPLETE & VERIFIED)**

---

## Key Milestone Completed: Issues 68 - 75 UI, Storage Concurrency Mutex & Export Consistency

### What Was Fixed
1. **Duplicate "PE" Badges Resolved (`src/components/SavedTab.tsx` — ISSUE-68)**:
   - Suppressed generic `typeStr` badge when `typeStr === 'PE'`, rendering exactly 1 pink `PE` category badge for PE items. Specific PE type codes (`PE1`, `B5PE`) display cleanly alongside the pink category badge.

2. **Search-Filtered Folder Deletion Scope (`src/components/SavedTab.tsx` — ISSUE-69)**:
   - Updated folder deletion trigger and confirmation popup copy when a search query is active, explicitly stating: *"Delete N search-matching exam(s) in folder 'XXX'? (M hidden exams will be kept)"*.

3. **Presigned S3 URL Extraction & Query String Regex (`src/utils/parser.ts` — ISSUE-70)**:
   - Enhanced `extractPeZipUrl` to pre-sanitize raw HTML string escapes (`\\/` -> `/`, `\u0026` -> `&`) and updated Stage 3 & 4 regex patterns to match presigned S3 URLs containing query parameters (`?X-Amz-Algorithm=...`) or case-insensitive `.ZIP` extensions.

4. **Numeric Product ID Extractor & PDF Viewer Fallback (`src/components/ViewerPanel.tsx` — ISSUE-71)**:
   - Implemented `extractNumericProductId` to resolve 6-digit numeric product IDs from dataset attributes (`id`, `pdfUrl`, `zipUrl`, `title`) before constructing `/api/exams/pdf?productId=${numericId}` iframe URLs, preventing 404 errors on fallback-generated dataset IDs.

5. **Storage Transaction Mutex Queue (`src/utils/storage.ts` — ISSUE-72)**:
   - Added Promise-chained `storageWriteQueue` mutex (`enqueueStorageTask`) serializing all `saveExamToStorage`, `deleteExamsFromStorage`, and `clearAllExamsFromStorage` calls, eliminating Read-Modify-Write storage race conditions during high-frequency batch fetches.

6. **Session Metadata in PDF Print Cover Header (`src/utils/exporter.ts` — ISSUE-73)**:
   - Added `examSessionTime` and `examSessionDate` metadata fields to `generatePrintHtml` PDF cover page headers matching Markdown exports.

7. **Fallback PDF Resolution in Bulk ZIP Exports (`src/utils/exporter.ts` — ISSUE-74)**:
   - Updated `exportBulkAsZip` to resolve fallback PDF API endpoints (`/api/exams/pdf?productId=${numericId}`) when `dataset.pdfUrl` is null, ensuring PE PDF papers are always included in bulk ZIP exports.

8. **Format Switcher Layout Optimization (`src/components/FormatSwitcher.tsx` & `src/styles/overlay.css` — ISSUE-75)**:
   - Added compact CSS styling (`.fus-header-switcher.mixed-mode`) with micro typography (9px) and tight padding, preventing format label wrapping or vertical overflow on 380px panel header toolbars.

---

## Verification & Build Results
- Clean TypeScript compilation via `tsc`.
- Production Vite build bundled into `/dist`.
- All 8 integration test suites passed 100% cleanly.

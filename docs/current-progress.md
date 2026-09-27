# Current Progress — fustation-tool

**Last Updated**: 2026-09-28
**Status**: 🟢 **SSOT scaffold installed; ISSUE-84 to ISSUE-98 resolved and verified; no open issues**

---

## Session Ledger: 2026-09-28 FE Export Fidelity & Bulk ZIP Integrity

- Audited every FE fixture (JPD113, PRO192, SSL101c, MAD101, MAE101: 240 questions, 8 multi-answer, 29 with images, math-heavy MAD101/MAE101) and the bulk ZIP path over FE and PE.
- Resolved ISSUE-85 to ISSUE-98 (see `log-issues.md`): currency `$` typeset as math, malformed `$$x$`, Markdown losing generics, code indentation and option breaks, bulk ZIP overwriting same-titled exams, silent missing PE assets, offline-broken print HTML math, fabricated metadata defaults, manifest drift, dead `chrome.downloads` branch, duplicated exam-id regexes, orphan storage key, untracked tests.
- Verification: `npm run build` green (tsc, vite, dist check, suite); `tests/test-flow.ts` adds TEST 7b (real `exportBulkAsZip`, FE + PE) and TEST 10 (all FE fixtures through MD and HTML). The new tests fail on the pre-fix code (bulk overwrite, currency math).
- Resume point: manual in-browser pass with `specs/fustation-tool/fullstack/ui-design/00-manual-testing-guide.md` on a logged-in session.

## Session Ledger: 2026-09-28 SSOT Scaffold Install

- Branch `features/Design_SSOT_Scaffold` created at `18dbfe7` (was a detached HEAD). Nothing committed yet.
- Installed the documentation-driven scaffold: `docs/00` to `05`, `docs/diagrams/`, `docs/flows/`, `specs/fustation-tool/fullstack/` (moved from `.kiro/specs/`, refreshed to current code, plus `api-design/` and `ui-design/` guides), `scripts/README.md`. `envs/` skipped (no secrets exist).
- Retired files: `web-architecture.md` -> `00`, `ui-conventions.md` -> `03`, `development-rules.md` split into `01`, `04`, `05`; `implementation-rules.md` merged into `05`; `extension-requirements.md` merged into `03` and `requirements.md`.
- Verification at install time: `tsc --noEmit` clean; `npm test` 9/9 suites pass (357-task discovery).
- Logged ISSUE-85 to ISSUE-89 in `log-issues.md`; open tasks are Phase 6 (12.1 to 14.1) in `specs/fustation-tool/fullstack/tasks.md`.
- Resume point: commit the ISSUE-84 code and the scaffold as separate commits, then pick Phase 6 task 12.1 (ISSUE-85, highest severity).

---

## Key Milestone Completed: ISSUE-84 `/marketplace/{id}` Dual-Route Normalization & Full Catalog Link Discovery

### What Was Implemented & Verified

1. **Dual-Route Exam ID Parsing (`src/utils/parser.ts` — ISSUE-84)**:
   - `getExamIdFromUrl` updated with non-capturing optional `(?:exam/)?` group, capturing CUID from both `/marketplace/{id}` and `/marketplace/exam/{id}`.
   - Added guards filtering out Next.js webpack layout assets (`!id.startsWith('layout-')`) and bare `'exam'` keywords.

2. **Overlay Route Classification (`src/components/Overlay.tsx` — ISSUE-84)**:
   - `classifyRoute` updated to classify both `/marketplace/{id}` and `/marketplace/exam/{id}` as `'exam'` routes.
   - Unlocked automatic exam fetch execution (`runFetch`) on cold boots, page reloads, and SPA navigation from `/home`.

3. **Background Service Worker Tab Listener (`src/background.ts` — ISSUE-84)**:
   - Updated `chrome.tabs.onUpdated` regex to capture both `/marketplace/{id}` and `/marketplace/exam/{id}` tab loads.

4. **Multi-Route Batch Task Discovery (`src/utils/batchFetcher.ts` — ISSUE-84)**:
   - Enhanced `extractProductTasksFromHtml` regex to match `/marketplace/(?:exam/)?([a-zA-Z0-9_-]+)`.
   - Scaled catalog task extraction on `hompage-fullfetch.html` from **30** to all **357 unique exam items**.

5. **Dynamic Presigned S3 ZIP Fallback Query (`src/utils/exporter.ts` — ISSUE-84)**:
   - Added `/marketplace/${cuid}?_rsc=1` and standard HTML fallback fetching in `fetchFreshPeZipUrl`.

---

## Previous Milestone: Bulk Batch Download Recovery & UI/UX Restoration (Issues 82 & 83)
- Dynamic S3 Presigned URL Refresh Engine querying `/marketplace/exam/${cuid}?_rsc=1`.
- Slide-up `ProgressFooter` & expandable log drawer.
- Compact 2-row radio grid matrix in `FormatSwitcher`.

---

## Verification & Build Results
- Clean TypeScript typecheck (`tsc --noEmit`).
- Production Vite extension bundle built into `/dist`.
- All 9 integration test suites passed 100% cleanly (including 357-task discovery test).

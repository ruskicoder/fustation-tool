# Current Progress — fustation-tool

**Last Updated**: 2026-09-28
**Status**: 🟢 **ISSUE-104, 107, 109 fixed; ISSUE-108 narrowed to one classification case; ISSUE-105 is platform data**

---

## Session Ledger: 2026-09-28 Size-Based Bulk Volumes (ISSUE-109)

- A live 508-exam bulk run produced 51 ZIPs (fixed 10 items each). Bulk volumes are now packed by byte budget with stage-and-rollback; one volume for typical runs.
- Live rerun also resolved most of ISSUE-108: PFP191 assets are HTTP 404 on the platform; `CSD203_FA25_FE_982738` being exported as PE remains to investigate.
- Verification: `npm run build` green including TEST 13, which fails on the previous exporter.
- Resume point: user tests the size-based bulk export in the browser; then the `CSD203_FA25_FE_982738` classification (ISSUE-108) and the manual browser pass.

## Session Ledger: 2026-09-28 PE Answer-Key ZIP Downloads (ISSUE-107)

- Spec first: Req 3.6 to 3.9, task 19 (Phase 8), `docs/02-backend-conventions.md`.
- Fresh presigned URL before every ZIP download; S3 fetched in the service worker (`FUSTATION_FETCH_ASSET`, S3 buckets in `host_permissions`); no fake-success anchor fallback; failures toast; object URLs revoked after 60 s.
- Verification: `npm run build` green (tsc, vite, dist check, all suites including new TEST 12, which fails on the previous exporter). `dist/` rebuilt and now includes ISSUE-106 and 107.
- Not verified live: the service-worker S3 fetch needs a logged-in browser pass.
- Live bulk run afterwards still logged PE failures; logged ISSUE-108 with read-only live findings and added HTTP status diagnostics to the bulk log and `manifest.md` (TEST 7b asserts it).
- ISSUE-104 fixed (task 18): `ZIP: Not provided` for sets whose live page publishes the paper but no answer key; definitive 4xx no longer retried; build time back to about 10 s.
- Resume point: reload the extension, rerun the bulk export, read the per-item HTTP status for ISSUE-108 (paste the Batch Progress Log, not only the page console); then the manual browser pass with `specs/fustation-tool/fullstack/ui-design/00-manual-testing-guide.md`, starting with a PE ZIP download.

## Session Ledger: 2026-09-28 Language Exams (Reading passages, Writing PDFs)

- Branches: old local `dev` renamed and pushed as `dev-archive` (`180b108`); new `dev` created from `7c80901` and pushed. Work continues on `dev`.
- Investigated the saved SPA capture and the live site (logged-in Chrome, read-only): TRS501 Reading, Writing, Reading+Writing, VG; TRS601 Reading; ENW493c Writing. No textarea questions exist; Reading uses shared passages, Writing is a PDF-only PE set.
- Fixed ISSUE-99 to 103 and 106 (see `log-issues.md`). Added fixtures under `docs/webfetches/examview/language/` and TEST 11; the new test fails on the previous code.
- Verification: `npm run build` green (tsc, vite, dist check, all suites).
- Session ended after logging ISSUE-107 (PE ZIP downloads 0 B / fail). Resume point: implement ISSUE-107 spec-first (Req 3, tasks, `02-backend-conventions`), then test, `npm run build`, commit and push to `dev`. After that: ISSUE-104, then a manual browser pass.

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

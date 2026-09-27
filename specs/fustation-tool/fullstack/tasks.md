# Implementation Plan: fustation-tool

## Phase 1: TypeScript, React TS & Vite Build Setup

- [x] 1. Project Scaffolding & TypeScript Config
  - [x] 1.1 Configure `package.json` with React, TypeScript, and Vite build dependencies
    - Install `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `@types/chrome`, `vite`
    - Setup `build` script to compile React TS entries into `/dist`
    - _Requirements: 9.1, 9.2_
  - [x] 1.2 Setup `tsconfig.json` & `vite.config.ts`
    - Configure TypeScript strict compiler options and React JSX transform
    - Configure Vite entrypoints for content script (`content.tsx`) and background worker (`background.ts`) building to `dist/`
    - Copy `manifest.json` into `dist/`
    - _Requirements: 9.1, 9.2_

---

## Phase 2: Core Data Types, RSC Parser & Exporter Engine

- [x] 2. TypeScript Data Models & RSC Payload Parser
  - [x] 2.1 Define Core Data Interfaces in `src/types/index.ts`
    - Define `ExamDataset`, `Question`, `Option`, `ExportFormat`, `StatusState`, `SavedExamItem`
    - _Requirements: 1.3, 6.1_
  - [x] 2.2 Implement `self.__next_f` script payload extractor in `src/utils/parser.ts`
    - Write type-safe RSC chunk parser and unescape logic
    - Implement `extractExamFromScripts()` and `manualRefetch()`
    - _Requirements: 1.3_

- [x] 3. Exporters & Chrome Local Storage Manager
  - [x] 3.1 Implement Exporters in `src/utils/exporter.ts` & `src/utils/compiler.ts`
    - Write Markdown compiler, PDF print window builder (`window.print()`), and JSON exporter in TypeScript
    - Format filenames as `{SubjectCode}_{ExamID}.{ext}`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 3.2 Implement Chrome Local Storage Manager in `src/utils/storage.ts`
    - Write Chrome `storage.local` wrappers for saving/retrieving exam sets and active format preferences
    - _Requirements: 5.1_

---

## Phase 3: React TS Component System & Injected Overlay

- [x] 4. React TS Components & Overlay Panel
  - [x] 4.1 Create Segmented Control Component in `src/components/FormatSwitcher.tsx`
    - Implement Radix-style ToggleGroup (`role="radiogroup"`, `role="radio"`, `aria-checked`, arrow-key movement) for `MD` | `PDF` | `JSON`
    - Apply fused track styling with smooth active background
    - _Requirements: 8.3, 6.1_
  - [x] 4.2 Create React Overlay Container & FAB in `src/components/Overlay.tsx`
    - Implement FAB button and collapsible panel container in React TS
    - Render header `fustation-tool v1.0.0`
    - Add `:focus-visible` offset ring styles in `src/styles/overlay.css`
    - _Requirements: 8.1, 8.3_
  - [x] 4.3 Assemble ExtractTab & SavedTab React Components
    - Build `src/components/ExtractTab.tsx`: Metadata overview + Format Switcher + `[ Fetch ]` / `[ Download ]` buttons
    - Build `src/components/SavedTab.tsx`: Cached list header `Saved Exams (X)` | `Export format: [ MD | PDF | JSON ]` | `[ Clear all ]` with row export buttons
    - _Requirements: 8.1, 5.4_
  - [x] 4.4 Mount React Content Script Entrypoint in `src/content.tsx`
    - Mount `<Overlay />` React component root onto target page DOM
    - _Requirements: 8.1_

---

## Phase 4: Service Worker & Build Verification

- [x] 5. Background Worker & Build Verification
  - [x] 5.1 Implement background worker in `src/background.ts`
    - Write Chrome web request and tab navigation observers in TypeScript
    - _Requirements: 1.3_
  - [x] 5.2 Build & Verify `/dist` Package Output
    - Execute `npm run build` to compile TypeScript & React assets into `/dist`
    - Verify `dist/manifest.json`, `dist/content.js`, and `dist/background.js`
    - _Requirements: 9.1, 9.2_

---

## Phase 5: Feature Expansion (implemented, reconciled 2026-09-28)

- [x] 6. Extraction robustness
  - [x] 6.1 Unified 4-phase RSC pipeline with polling retry and single guarded reload in `Overlay.tsx`
    - Resolved ISSUE-01, 17, 19, 29, 42, 44, 45, 46
    - _Requirements: 1.3, 1.4, 1.5, 1.7_
  - [x] 6.2 Dual-route exam recognition `/marketplace/{id}` and `/marketplace/exam/{id}` (ISSUE-84, uncommitted at reconciliation time)
    - _Requirements: 1.1, 1.2_
  - [x] 6.3 SPA navigation handling via `FUSTATION_URL_CHANGED` and content keep-alive observer (ISSUE-21)
    - _Requirements: 1.6_
- [x] 7. PE assets and viewer
  - [x] 7.1 PE classification, PDF URL validation, presigned ZIP extraction and 403 refresh (ISSUE-53, 55, 60, 66, 70, 80, 82)
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 Full-height PDF viewer with debounced search (ISSUE-58, 63, 71)
    - _Requirements: 3.4_
- [x] 8. Math and images
  - [x] 8.1 KaTeX rendering with escaped-dollar sentinel masking (ISSUE-48, 77, 78, 79)
    - _Requirements: 4.1_
  - [x] 8.2 S3 image proxy, base64 embedding, DOM canvas fallback (ISSUE-49, 51)
    - _Requirements: 4.2, 4.3, 4.4_
- [x] 9. Library and exports
  - [x] 9.1 Serialized storage writes and schema normalization (ISSUE-11, 22, 59, 72)
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 9.2 Saved tab folders, inspector, per-item actions, search scope (ISSUE-14, 33, 34, 64, 68, 69)
    - _Requirements: 5.4_
  - [x] 9.3 MD, PDF print, JSON, PE export routing and filename de-duplication (ISSUE-23, 25, 62, 73, 81)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
- [x] 10. Batch and bulk
  - [x] 10.1 Catalog discovery, preview queue, pause and stop, persisted batch state (ISSUE-12)
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 10.2 10-item ZIP volumes with `manifest.md` audit and progress footer (ISSUE-54, 74, 82, 83)
    - _Requirements: 7.4, 7.5_
- [x] 11. Overlay UI
  - [x] 11.1 Draggable, resizable panels, themes, toasts, skeletons, focus rings (ISSUE-08, 32, 37, 38, 39, 40, 75)
    - _Requirements: 8.1, 8.2, 8.3_

---

## Phase 6: Correctness Fixes (resolved 2026-09-28, see `docs/log-issues.md`)

- [x] 12. Manifest and Chrome API correctness
  - [x] 12.1 Add `webNavigation` (and any other used API) to `src/manifest.json`; delete the stale root `manifest.json` (ISSUE-85)
    - _Requirements: 9.2, 1.6_
  - [x] 12.2 Route downloads that need `chrome.downloads` through a service-worker message, or drop the dead branch in `downloadAssetUrl` (ISSUE-86)
    - _Requirements: 3.3, 6.4, 9.2_
- [x] 13. Exam id ownership
  - [x] 13.1 Extract one shared exam-id and route helper (CUID-shaped) in `parser.ts` and use it from `Overlay.tsx`, `background.ts`, `batchFetcher.ts`, `exporter.ts` (ISSUE-87)
    - _Requirements: 1.1, 1.2, 7.1_
  - [x] 13.2 Read or remove the orphan `fustation_catalog` key written by `background.ts` (ISSUE-88)
    - _Requirements: 7.1_
- [x] 14. Test portability
  - [x] 14.1 Move the fixture suite out of gitignored `scratch/` into a tracked `tests/` path and point `npm test` at it (ISSUE-89)
    - _Requirements: 9.1_

- [x] 15. FE export fidelity
  - [x] 15.1 Normalize `$` delimiters: currency stays literal, malformed `$$x$` repaired, symbol fixes only inside math (ISSUE-90, 91, 97)
    - _Requirements: 4.1_
  - [x] 15.2 Markdown: fenced code bodies, escaped `<`, hard-broken options and lines, no fabricated defaults (ISSUE-92, 96)
    - _Requirements: 6.1, 2.4_
  - [x] 15.3 Print HTML: MathML-only output, escaped header, pre-wrap text (ISSUE-95, 98)
    - _Requirements: 6.2, 4.1_
- [x] 16. Bulk ZIP integrity
  - [x] 16.1 Unique file names per volume and `Missing` audit rows for unresolvable PE assets (ISSUE-93, 94)
    - _Requirements: 7.4_
  - [x] 16.2 Fixture tests: every FE fixture through MD and HTML, real `exportBulkAsZip` over FE and PE (tests/test-flow.ts TEST 7b, TEST 10)
    - _Requirements: 9.1_

---

## Phase 7: Language Exams (resolved 2026-09-28)

- [x] 17. Reading and Writing recognition
  - [x] 17.1 Resolve hex-length RSC text rows by UTF-8 bytes; treat `"$undefined"` as absent (ISSUE-100, 102)
    - _Requirements: 1.8, 1.9_
  - [x] 17.2 Parse `readingPassages` into `ExamDataset.passages`; keep them through storage normalization (ISSUE-99, 103)
    - _Requirements: 4A.1, 4A.3_
  - [x] 17.3 Render passages in Markdown, print HTML and the viewer before their first question (ISSUE-99)
    - _Requirements: 4A.2_
  - [x] 17.4 PE DOM fallback and extraction validation require a real asset, so SPA-navigated FE pages reload instead of saving an empty PE (ISSUE-101)
    - _Requirements: 1.10, 3.5_
  - [x] 17.5 Replace invented metadata defaults with `N/A` in parser, storage and UI (ISSUE-106)
    - _Requirements: 2.4_
  - [x] 17.6 Fixtures `docs/webfetches/examview/language/` and TEST 11 (Reading passage, Writing PDF, SPA fallback)
    - _Requirements: 9.1_
- [ ] 18. Writing-set answer-key audit label (ISSUE-104)
  - _Requirements: 7.4_

## Phase 8: PE Asset Download Reliability

- [x] 19. PE answer-key ZIP downloads (ISSUE-107)
  - [x] 19.1 `resolvePeZipUrl`: fresh RSC URL first, stored `zipUrl` as fallback, used by `downloadZipAsset`, `exportSinglePe` and `exportBulkAsZip`
    - _Requirements: 3.3, 3.6_
  - [x] 19.2 `fetchAsset`: fustation.net URLs fetched with credentials, other hosts through the `FUSTATION_FETCH_ASSET` service-worker message; S3 hosts added to `host_permissions`
    - _Requirements: 3.7_
  - [x] 19.3 Remove the cross-origin anchor fallback; surface `false` as an error toast in `Overlay.tsx` and `ViewerPanel.tsx`; delay `revokeObjectURL` by 60 s
    - _Requirements: 3.8, 3.9_
  - [x] 19.4 TEST 12: stale stored `zipUrl`, fresh URL fetched first, failure returns `false` without a download
    - _Requirements: 9.1_
  - [x] 19.5 Record the last HTTP status and the exam title for every missing PE asset in the bulk log and `manifest.md`; strip presigned query strings (ISSUE-108)
    - _Requirements: 3.8, 7.4_

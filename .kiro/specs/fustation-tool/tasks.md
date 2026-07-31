# Implementation Plan: fustation-tool

## Phase 1: TypeScript, React TS & Vite Build Setup

- [x] 1. Project Scaffolding & TypeScript Config
  - [x] 1.1 Configure `package.json` with React, TypeScript, and Vite build dependencies
    - Install `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `@types/chrome`, `vite`
    - Setup `build` script to compile React TS entries into `/dist`
    - _Requirements: 4.1, 4.2_
  - [x] 1.2 Setup `tsconfig.json` & `vite.config.ts`
    - Configure TypeScript strict compiler options and React JSX transform
    - Configure Vite entrypoints for content script (`content.tsx`) and background worker (`background.ts`) building to `dist/`
    - Copy `manifest.json` into `dist/`
    - _Requirements: 4.1, 4.2_

---

## Phase 2: Core Data Types, RSC Parser & Exporter Engine

- [x] 2. TypeScript Data Models & RSC Payload Parser
  - [x] 2.1 Define Core Data Interfaces in `src/types/index.ts`
    - Define `ExamDataset`, `Question`, `Option`, `ExportFormat`, `StatusState`, `SavedExamItem`
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Implement `self.__next_f` script payload extractor in `src/utils/parser.ts`
    - Write type-safe RSC chunk parser and unescape logic
    - Implement `extractExamFromScripts()` and `manualRefetch()`
    - _Requirements: 1.1, 1.2_

- [x] 3. Exporters & Chrome Local Storage Manager
  - [x] 3.1 Implement Exporters in `src/utils/exporter.ts` & `src/utils/compiler.ts`
    - Write Markdown compiler, PDF print window builder (`window.print()`), and JSON exporter in TypeScript
    - Format filenames as `{SubjectCode}_{ExamID}.{ext}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 3.2 Implement Chrome Local Storage Manager in `src/utils/storage.ts`
    - Write Chrome `storage.local` wrappers for saving/retrieving exam sets and active format preferences
    - _Requirements: 2.2_

---

## Phase 3: React TS Component System & Injected Overlay

- [x] 4. React TS Components & Overlay Panel
  - [x] 4.1 Create Segmented Control Component in `src/components/FormatSwitcher.tsx`
    - Implement Radix-style ToggleGroup (`role="radiogroup"`, `role="radio"`, `aria-checked`, arrow-key movement) for `MD` | `PDF` | `JSON`
    - Apply fused track styling with smooth active background
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Create React Overlay Container & FAB in `src/components/Overlay.tsx`
    - Implement FAB button and collapsible panel container in React TS
    - Render header `fustation-tool v1.0.0`
    - Add `:focus-visible` offset ring styles in `src/styles/overlay.css`
    - _Requirements: 3.1, 3.2, 3.6_
  - [x] 4.3 Assemble ExtractTab & SavedTab React Components
    - Build `src/components/ExtractTab.tsx`: Metadata overview + Format Switcher + `[ Fetch ]` / `[ Download ]` buttons
    - Build `src/components/SavedTab.tsx`: Cached list header `Saved Exams (X)` | `Export format: [ MD | PDF | JSON ]` | `[ Clear all ]` with row export buttons
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 4.4 Mount React Content Script Entrypoint in `src/content.tsx`
    - Mount `<Overlay />` React component root onto target page DOM
    - _Requirements: 3.1_

---

## Phase 4: Service Worker & Build Verification

- [x] 5. Background Worker & Build Verification
  - [x] 5.1 Implement background worker in `src/background.ts`
    - Write Chrome web request and tab navigation observers in TypeScript
    - _Requirements: 1.1_
  - [x] 5.2 Build & Verify `/dist` Package Output
    - Execute `npm run build` to compile TypeScript & React assets into `/dist`
    - Verify `dist/manifest.json`, `dist/content.js`, and `dist/background.js`
    - _Requirements: 4.1, 4.2_

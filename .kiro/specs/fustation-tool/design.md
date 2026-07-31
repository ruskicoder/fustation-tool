# Technical Design: fustation-tool

## 1. Overview

`fustation-tool` is a Chromium Manifest V3 browser extension built with **TypeScript, React 18, and Vite**. It compiles all source code from `src/` into a production-ready `/dist` output folder. It extracts exam question banks from `fustation.net` by parsing Next.js App Router RSC inline script payloads (`self.__next_f`), converts them into clean offline Markdown (`.md`), PDF documents, or JSON files, and provides local session storage caching.

---

## 2. Architecture

```mermaid
flowchart TB
    subgraph Browser Target Page (fustation.net)
        ScriptTags["Inline Script Tags (self.__next_f)"]
        DOM["Target Page DOM"]
        FAB["Floating Overlay UI (React TS App)"]
    end

    subgraph Extension Distribution (/dist)
        CS["Content Script (content.js)"]
        SW["Service Worker (background.js)"]
        Storage["Chrome Storage Local (chrome.storage.local)"]
    end

    ScriptTags -->|Extract JSON Payload| CS
    CS -->|Mount React Overlay| FAB
    CS -->|Save Extracted Exam| Storage
    CS -->|Send Network Event / Bulk ID| SW
    SW -->|Cache Exam Catalog| Storage
    FAB -->|Format Switcher: MD/PDF/JSON| CS
    CS -->|Export Selected Filetype| Storage
```

---

## 3. Components and Interfaces (TypeScript)

### A. Core Data Types (`src/types/index.ts`)
```typescript
export type ExportFormat = 'MD' | 'PDF' | 'JSON';
export type StatusState = 'ready' | 'fetching' | 'processing' | 'downloading' | 'extracted' | 'error';

export interface Option {
  id: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  index: number;
  id: string;
  text: string;
  imageUrl: string | null;
  correctAnswers: string[];
  options: Option[];
}

export interface ExamDataset {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  author: string; // Campus / Uploader (e.g. "XAVALO")
  totalQuestions: number;
  questions: Question[];
}

export interface SavedExamItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  author: string;
  totalQuestions: number;
  extractedAt: string;
  dataset: ExamDataset;
}
```

### B. RSC Parser (`src/utils/parser.ts`)
- `extractExamFromScripts(): ExamDataset | null`: Parses `self.__next_f` script chunks for `initialData`.
- `manualRefetch(): ExamDataset | null`: Re-scans script payloads and DOM nodes if auto-extraction is incomplete.

### C. Exporters (`src/utils/exporter.ts`)
- `exportExam(dataset: ExamDataset, format: ExportFormat)`:
  - `MD`: Compiles clean Markdown schema and triggers download of `{SubjectCode}_{ExamID}.md`.
  - `PDF`: Renders print window with `@media print` CSS and calls `window.print()`.
  - `JSON`: Downloads raw dataset JSON `{SubjectCode}_{ExamID}.json`.

### D. React Overlay Components
- `src/components/Overlay.tsx`: Main floating overlay component (FAB + Panel).
- `src/components/FormatSwitcher.tsx`: Radix-style Accessible Segmented Control.
- `src/components/ExtractTab.tsx`: Metadata overview + Format Switcher + Fetch / Download actions.
- `src/components/SavedTab.tsx`: Cached exams drawer with single-click export.

---

## 4. Build Strategy & Directory Layout

### Root Directory Structure:
```
fustation-tool/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── manifest.json
│   ├── background.ts
│   ├── content.tsx
│   ├── types/index.ts
│   ├── utils/
│   │   ├── parser.ts
│   │   ├── compiler.ts
│   │   ├── exporter.ts
│   │   └── storage.ts
│   ├── components/
│   │   ├── Overlay.tsx
│   │   ├── FormatSwitcher.tsx
│   │   ├── ExtractTab.tsx
│   │   └── SavedTab.tsx
│   └── styles/
│       └── overlay.css
└── dist/ (Built Artifacts)
    ├── manifest.json
    ├── background.js
    ├── content.js
    └── assets/
```

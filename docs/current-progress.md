# Current Progress & Technical Roadmap: fustation-tool

## 1. Active Feature Implementation Status

- [x] **Manifest V3 Setup**: Content script injection, service worker, storage permissions for `fustation.net`.
- [x] **TypeScript + React TS Stack**: Vite build pipeline outputting to `/dist`.
- [x] **Fixed 2:1 Aspect Ratio Panel**: Overlay locked to `580px` width × `290px` height.
- [x] **Zero-Shift Header Status Pill**: Fixed `140px` width status container.
- [x] **Hybrid Parser & Interactive Async DOM Crawler**: Full HTML parsing + step-by-step DOM Crawler for 1..N questions.
- [x] **Universal Format Switcher**: Radix-style Segmented Control (`MD` | `PDF` | `JSON`).
- [x] **Separated Save vs Download Business Logic**: `[ Save ]` caches dataset without file downloads; `[ Download ]` exports selected filetype.
- [x] **Sticky Saved Tab Toolbar**: Top toolbar remains fixed at top of tab container when scrolling saved items.
- [x] **Red Clear-All Danger Button**: Styled with `.fus-btn-danger`.
- [x] **Option Text Sanitization**: Prefix removal (`A.`, `A:`, `A `) and text deduplication.

---

## 2. Updated Exam Code Specification

Exam codes are tokenized as:
```
[SubjectCode]_[Term]_[Type]_[ExamCode]
```

- **`SubjectCode`**: **3 Alphas + 3 Numericals + 0-2 Optional Alphas** (`^[A-Z]{3}\d{3}[A-Za-z]{0,2}`). E.g. `MLN122`, `DBM302m`, `WED201C`, `SWE202C`. Positioned strictly at **START**.
- **`Term`**: **2 Alphas + 2 Numericals** (`[A-Z]{2}\d{2}`). E.g. `SP26`, `SU26`, `FA25`.
- **`Type`**: **1 to 5 Alphanumericals** (`[A-Z0-9]{1,5}`). E.g. `FE`, `PE1`, `RE`, `B5FE`.
- **`ExamCode`**: **6 Numericals** (`\d{6}$`). E.g. `915637`, `887674`, `312264`. Positioned strictly at **END**.

---

## 3. Pending Features & Nice-To-Haves (Roadmap)

### A. SavedTab Tokenized Search & Filter (Nice-to-Have)
- Search/filter input in `SavedTab` header to filter cached exams by subject code, term, or title.

### B. Catalog Route & Bulk Extraction Mechanism (Under Investigation)
- **Route Support**: `/home` and `/subjects/[subjectCode]`.
- **Server Component Stream (`text/x-component`)**:
  - `GET /home?_rsc=...`: Returns initial 20 `initialProducts`.
  - `POST /home` (Server Action): Paginates remaining products in `initialProducts` list.
  - `GET /home/subject/[code]?_rsc=...`: Returns catalog filtered by course.
- **Bulk Extraction Mechanism**:
  - Content script detects catalog route `/home` or `/subjects/[code]`.
  - Parses `initialProducts` array to retrieve list of product IDs and metadata.
  - Enables user to click "Batch Extract All" to fetch question payloads for all items in the catalog.

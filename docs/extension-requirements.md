# Extension Functional & UI Requirements: fustation-tool

## 1. Tech Stack & Build Architecture
- **Tech Stack**: TypeScript + React 18 (React TS).
- **Extension Standard**: Manifest V3 Chromium Extension.
- **Build Output Directory**: `/dist` (Vite / Rollup bundle output).
- **Header Title**: `fustation-tool v1.0.0` (without `MV3` label).
- **Panel Aspect Ratio**: Strict 2:1 Fixed Aspect Ratio (`580px` width × `290px` height).

---

## 2. Exam Code Format Specification

The exam code string follows the format:
```
[SubjectCode]_[Term]_[Type]_[ExamCode]
```

### Parsing Rules
1. **`SubjectCode`**: 3 ALL CAPS Alphas + 3 Numericals + 0 to 2 Optional Alphas (e.g. `MLN122`, `PRM393`, `DBM302m`, `WED201C`, `SWE202C`). Positioned strictly at the **START** of the code string (`^[A-Z]{3}\d{3}[A-Za-z]{0,2}`).
2. **`Term`**: 2 ALL CAPS Alphas + 2 Numericals (e.g. `SP26`, `SU26`, `FA25`).
3. **`Type`**: 1 to 5 Alphanumericals (e.g. `FE`, `PE1`, `RE`, `B5FE`).
4. **`ExamCode`**: 6 Numericals (e.g. `915637`, `887674`, `312264`). Positioned strictly at the **END** of the code string (`\d{6}$`).
5. **Separators**: Underscores `_` separate the tokens. Middle fields may vary in arrangement or append sub-letters, but `SubjectCode` is always Token 1 and `ExamCode` (6 digits) is always Token N.

---

## 3. Functional & UI Business Rules

### Rule 1: Header UI Styling & Layout Stability
- **Header Text**: Displays `fustation-tool v1.0.0`.
- **Tabs**: `Extract` vs `Saved (X)`
- **Dynamic Status Pill**: Fixed width `140px` container to guarantee **zero pixel shifts** during status transitions (`Ready`, `Fetching (X/Y)...`, `Processing...`, `Downloading...`, `Saved / Ready`, `Error`).

### Rule 2: Left Column Info Panel (Exam Overview)
- **Displayed Metadata**:
  1. Subject Badge (e.g. `MLN122`)
  2. Subject Name (e.g. `Kinh tế chính trị Mác-Lênin`)
  3. Campus / Uploader Badge (e.g. `XAVALO`, `HOLA`)
  4. Exam Code: Formatted as `[SubjectCode]_[Term]_[Type]_[ExamCode]` (e.g., `MLN122_SP26_B5FE_915637`)
  5. Ca thi / Session: Formatted as `09:10 | 29/04/2026`
  6. Exam Type Badge: Formatted as `FE`, `PE`, or `RE`
  7. Total Questions Count (e.g., `60 Questions`)

### Rule 3: Universal Export Format Switcher (Segmented Control)
- **Component**: React TS Segmented Control (`role="radiogroup"` containing `role="radio"` items with `aria-checked` state and keyboard arrow-key navigation).
- **Supported Formats (Exact Order)**: `MD` | `PDF` | `JSON`
- **Default Format**: `MD`
- **Visual Styling**: Fused buttons inside a single bordered track with an active gradient background.

### Rule 4: Extract Tab Action Stack
- **Layout (Right Column)**:
  - Top: `Export format` label + Segmented Control `[ MD | PDF | JSON ]`
  - Middle: Dual action row `[ Fetch ]` | `[ Save ]`
  - Bottom: Full-width primary action button `[ Download ]`

### Rule 5: Saved Exams Tab & Sticky Toolbar
- **Sticky Top Toolbar**: `Saved (X)` | `[ MD | PDF | JSON ]` | `[ Clear all ]` fixed at top of tab container.
- **Red "Clear all" Button**: Styled with distinct red danger styling (`fus-btn-danger`).
- **Row Action**: Single download button (`svg` download icon) per saved exam row exporting in active format.

---

## 4. Requirements (EARS Format)

### Requirement 1: Next.js RSC Payload Extraction & Fallback DOM Crawler
- **Acceptance Criteria**:
  1. WHEN an exam page (`/marketplace/exam/[id]`) loads THEN the content script SHALL scan `document.documentElement.innerHTML` and `document.scripts` for Next.js `self.__next_f` payloads containing `initialData.questions`.
  2. WHEN auto-extraction is unavailable THEN the system SHALL run an automated DOM Crawler that turns on Study Mode (`#study-mode-toggle`), extracts questions & correct answers, and clicks "Sau" (Next) through all `1..N` questions.

### Requirement 2: Export Formats (`MD`, `PDF`, `JSON`)
- **Acceptance Criteria**:
  1. IF `MD` is selected THEN output SHALL format `[info]` headers (including Subject, Title, Campus, Exam Session, Exam Type, Term, Total Questions; excluding Seller & Price), `### Question X:`, `A.`-`D.` options, and `Answer: X` (key-only).
  2. IF `PDF` is selected THEN output SHALL render a print document window with `@media print` CSS and invoke `window.print()`.
  3. IF `JSON` is selected THEN output SHALL export raw structured JSON datasets.
  4. THEN output files SHALL be named `{SubjectCode}_{ExamID}.{ext}`.

### Requirement 3: Build & Distribution
- **Acceptance Criteria**:
  1. WHEN `npm run build` is executed THEN Vite/TypeScript SHALL compile all React TS entries into the `/dist` directory.

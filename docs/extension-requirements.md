# Extension Functional & UI Requirements: fustation-tool

## 1. Tech Stack & Build Architecture
- **Tech Stack**: TypeScript + React 18 (React TS).
- **Extension Standard**: Manifest V3 Chromium Extension.
- **Build Output Directory**: `/dist` (Vite / Rollup bundle output).
- **Header Title**: `fustation-tool v1.0.0` (without `MV3` label).

---

## 2. Functional & UI Business Rules

### Rule 1: Header UI Styling
- **Header Text**: Displays `fustation-tool v1.0.0`.
- **Tabs**: `Extract` vs `Saved (X)`
- **Dynamic Status Pill**: `• Ready`, `• Fetching...`, `• Processing...`, `• Downloading...`, `• Extracted`, `• Error`.

### Rule 2: Left Column Info Panel (Exam Overview)
- **Metrics Removal**: All metric boxes (`Questions`, `Semester`, `Section`) are completely removed.
- **Displayed Metadata**:
  1. Subject Badge (e.g. `MLN122`)
  2. Subject Name (e.g. `Kinh tế chính trị Mác-Lênin`)
  3. Campus / Uploader Badge (e.g. `XAVALO`)
  4. Exam Code: Formatted as `[examcode]_[term]_[Code]_[6-digit-numeric]` (e.g., `MLN122_SP26_B5FE_915637`)
  5. Total Questions Count (e.g., `60 Questions`)

### Rule 3: Universal Export Format Switcher (Segmented Control)
- **Component**: React TS Segmented Control (`role="radiogroup"` containing `role="radio"` items with `aria-checked` state and keyboard arrow-key navigation).
- **Supported Formats (Exact Order)**: `MD` | `PDF` | `JSON`
- **Default Format**: `MD`
- **Visual Styling**: Fused buttons inside a single bordered track with a sliding background or active pill background.

### Rule 4: Extract Tab Action Controls
- **Layout (Right Column)**:
  - Top Center: Export format switcher label and control: `Export format: [ MD | PDF | JSON ]`
  - Bottom Action Row: `[ Fetch ]` | `[ Download ]`
- **`Fetch` Button**:
  - Manual fallback trigger to refetch/rescan questions if auto-extraction misses items.
- **`Download` Button**:
  - Triggers immediate export of active exam set in the selected format (`MD`, `PDF`, or `JSON`).
  - **Focus Ring Accessibility**: Styled with `:focus-visible` offset ring.

### Rule 5: Saved Exams Tab
- **Header Layout**:
  `Saved Exams (X)` | `Export format: [ MD | PDF | JSON ]` | `[ Clear all ]`
- **Row Action**: Single `[ 📥 ]` download button per saved exam row exporting in the active format.

---

## 3. Requirements (EARS Format)

### Requirement 1: Next.js RSC Payload Extraction & Fallback
- **Acceptance Criteria**:
  1. WHEN an exam page (`/marketplace/exam/[id]`) loads THEN the React content script SHALL scan `document.scripts` for Next.js `self.__next_f` payloads containing `initialData.questions`.
  2. WHEN the user clicks "Fetch" THEN the system SHALL manually re-scan page memory and DOM elements for any missing questions.

### Requirement 2: Export Formats (`MD`, `PDF`, `JSON`)
- **Acceptance Criteria**:
  1. IF `MD` is selected THEN the system SHALL compile Markdown with `[info]` header metadata, `### Question X:`, `A.`-`D.`, and `Answer: X`.
  2. IF `PDF` is selected THEN the system SHALL open a printable HTML document window with `@media print` CSS and invoke `window.print()`.
  3. IF `JSON` is selected THEN the system SHALL download raw JSON datasets.
  4. THEN output files SHALL be named `{SubjectCode}_{ExamID}.{ext}`.

### Requirement 3: Build & Distribution
- **Acceptance Criteria**:
  1. WHEN `npm run build` is executed THEN Vite/TypeScript SHALL compile all React TS entries (`content.tsx`, `background.ts`, overlay CSS, `manifest.json`) into the `/dist` directory.

# 00 System Context: fustation.net & fustation-tool

## 0. Purpose & Scope

`fustation-tool` is a Manifest V3 Chromium extension for `fustation.net`. The platform exposes exam question banks one question at a time and offers learners no bulk export. The extension extracts every question of an exam set (FE) or the paper and answer-key assets of a practical exam (PE), caches them locally, and exports them for offline study as Markdown, PDF, JSON, or ZIP.

- Target site: `https://www.fustation.net`
- Example exam view: `https://www.fustation.net/marketplace/exam/cmol4jwyh000004i3rxquc7sa` (the platform also serves `/marketplace/{id}`)
- Out of scope: any backend of our own, accounts, payment, or bypassing `hasAccess`. The extension only reads data the logged-in session already receives.

Glossary: **FE** final exam (multiple choice, question list), **PE** practical exam (PDF paper plus answer-key ZIP), **RE** retake, **CUID** the 25-character platform product id (`c` + 24 lowercase alphanumerics), **RSC** Next.js React Server Component stream (`self.__next_f.push`).

Related: architecture layers in `01-architecture-conventions.md`, data pipeline and platform endpoints in `02-backend-conventions.md`, diagrams in `diagrams/` and `flows/`.

## 1. Extension Tech Stack
- **Framework & Language**: React 18 + TypeScript (React TS).
- **Extension Standard**: Chromium Extension Manifest V3 (MV3).
- **Bundler & Build Tooling**: Vite with TypeScript compiler (`tsc`) outputting to `/dist`.
- **Styling**: Vanilla CSS (`src/styles/overlay.css`) with Glassmorphism design tokens (`backdrop-filter: blur(28px)`).
- **Accessibility**: Radix-style ToggleGroup (`role="radiogroup"` / `role="radio"`) with keyboard arrow-key navigation and `:focus-visible` offset rings.

---

## 2. Platform Domain Entities & Schema Specifications

Based on comprehensive analysis of server payloads across `/home`, `/subjects/[subjectCode]`, and `/marketplace/exam/[id]`, the following entities form the core platform data model:

### A. Major Program (`MajorProgram`)
Academic major program (e.g. Software Engineering).
```typescript
interface MajorProgram {
  id: string;        // CUID (e.g. "cmot19i120000dktomy9njp54")
  slug: string;      // URL slug (e.g. "ky-thuat-phan-mem")
  name: string;      // Major title (e.g. "Kỹ thuật phần mềm")
  terms?: Term[];    // Curriculum terms
}
```

### B. Major Term / Semester (`Term`)
Curriculum term index within a major.
```typescript
interface Term {
  term: number;         // Term number (1..9)
  subjects: Subject[];  // List of courses taught in term
}
```

### C. Subject / Course (`Subject`)
Academic course subject.
```typescript
interface Subject {
  code: string;  // Subject code: 3 Alphas + 3 Numericals + 0-2 Alphas (e.g. "PRM393", "DBM302m", "WED201C")
  name: string;  // Course title (e.g. "Phát triển ứng dụng di động")
}
```

### D. Platform Statistics (`PlatformStats`)
Global platform metrics returned on catalog routes.
```typescript
interface PlatformStats {
  examCount: number;     // Total exam sets (e.g. 330)
  subjectCount: number;  // Total subjects (e.g. 153)
}
```

### E. Product Summary (`ExamSetSummary`)
Catalog product card metadata (Homepage & Subject listings).
```typescript
interface ProductSummary {
  id: string;                     // CUID (e.g. "cms5ks213000304i7gbldi37p")
  title: string;                  // Exam title string (e.g. "PRM393_SU26_FE_887674")
  price: number;                  // Price in VND (e.g. 0)
  imageUrl: string | null;        // Thumbnail cover image
  category: string;               // Category enum ("SOURCE_EXAM")
  examType: 'FE' | 'PE' | 'RE';   // Exam type enum (FE=Final, PE=Practical, RE=Retake)
  examSessionTime: string | null; // Session time (e.g. "10:50")
  examSessionDate: string | null; // Session date (ISO string stripped of $D prefix)
  campus: string;                 // Campus code (e.g. "XAVALO", "HOLA")
}
```

### F. Product Detail (`ExamSetDetail`)
Full product entity returned on exam view (`/marketplace/exam/[id]`).
```typescript
interface ProductDetail {
  id: string;                // CUID (e.g. "cmol4jwyh000004i3rxquc7sa")
  title: string;             // Full exam title (e.g. "MLN122_SP26_B5FE_915637")
  description: string;       // Campus / Uploader code (e.g. "XAVALO")
  price: number;             // Price (e.g. 0)
  category: string;          // Category enum ("SOURCE_EXAM")
  examType: 'FE'|'PE'|'RE';  // Exam type
  subjectCode: string;       // Subject code (e.g. "MLN122")
  subject: Subject;          // Nested subject object
  seller: Seller;            // Uploader user profile
  createdAt: string;         // ISO Creation date
  isActive: boolean;         // Product status flag
  questions: Question[];     // Question cards
}
```

### G. Seller / User Profile (`Seller`)
User entity representing uploaders or student accounts.
```typescript
interface Seller {
  id: string;                    // CUID (e.g. "cmjac22no00023wto3ke4z7js")
  name: string;                  // Full name (e.g. "Nguyễn Trọng Nguyên")
  username: string;              // Username (e.g. "admin1")
  email?: string;                // Email address
  image?: string | null;         // Avatar URL
  role?: 'STUDENT' | 'ADMIN';    // System role
  trustScore: number;            // Reputation score
  successfulTransactions?: number;
  fiveStarRatings?: number;
  mssv?: string | null;          // Student ID (e.g. "SE192357")
  fusVerified?: boolean;         // Verification status
  foundingMember?: boolean;
}
```

### H. Access Control & Campaign (`AccessControl`)
Permission state for unlocking exam questions.
```typescript
interface AccessControl {
  hasAccess: boolean;     // Whether current user has access to full questions
  accessReason: string;   // Access grant reason ("subscription", "free")
  campaign: {
    active: boolean;      // Active promotional campaign status
  };
}
```

### I. Question Item (`Question`) & Option (`Option`)
Individual question card and choice option structures.
```typescript
interface Question {
  id: string;                  // Unique question ID (e.g. "q_1777531136180_0_sk03ztva8")
  text: string;                // Question text prompt
  imageUrl: string | null;     // Attachment diagram/formula image URL
  options: Option[];           // Array of choice options (A, B, C, D)
  correctAnswers: string[];    // Array of correct choice keys (e.g. ["A"])
  correctAnswersCount: number; // Correct choice count (e.g. 1)
}

interface Option {
  id: string;    // Choice key ("A", "B", "C", "D")
  text: string;  // Choice text content
}
```

### J. Parsed Title Metadata (`TitleMetadata`)
Derived metadata extracted from standard exam title string (`[SubjectCode]_[Term]_[Type]_[ExamCode]`):
```typescript
interface TitleMetadata {
  subjectCode: string;  // 3 Alphas + 3 Numericals + 0-2 Alphas (START)
  termCode: string;     // 2 Alphas + 2 Numericals
  typeCode: string;     // 1-5 Alphanumericals
  examCode: string;     // 6 Numericals (END)
}
```

---

## 3. Exam Code Structure & Token Parsing Rules

The exam set title code follows a tokenized structure separated by underscores (`_`):

```
[SubjectCode]_[Term]_[Type]_[ExamCode]
```

### Structural Rules & Token Specifications
1. **`SubjectCode`** (Token 1 - START):
   - Formatted strictly as **3 Uppercase Alphas + 3 Numericals + 0 to 2 Optional Alphas**.
   - Pattern: `^[A-Z]{3}\d{3}[A-Za-z]{0,2}` (e.g. `MLN122`, `PRM393`, `DBM302m`, `WED201C`, `SWE202C`).
   - **Guaranteed Location**: Always positioned at the very **START** of the code string.

2. **`Term`** (Middle Token):
   - Formatted as **2 Uppercase Alphas + 2 Numericals**.
   - Pattern: `[A-Z]{2}\d{2}` (e.g. `SP26` = Spring 2026, `SU26` = Summer 2026, `FA25` = Fall 2025).

3. **`Type`** (Middle Token):
   - Formatted as **1 to 5 Alphanumericals** (ALL CAPS).
   - Pattern: `[A-Z0-9]{1,5}` (e.g. `FE` = Final Exam, `PE1` = Practical Exam 1, `RE` = Retake Exam, `B5FE` = Block 5 FE).

4. **`ExamCode`** (Token N - END):
   - Formatted strictly as **6 Numericals**.
   - Pattern: `\d{6}$` (e.g. `915637`, `887674`, `312264`, `224890`, `859065`).
   - **Guaranteed Location**: Always positioned at the very **END** of the code string.

---

## 5. Exam View RSC Payload Structure & Control Character Unescaping Rules

### A. RSC Push Chunk Payload Structure (`self.__next_f.push`)
On `/marketplace/exam/[id]`, the server injects exam data via Next.js RSC stream chunks (`self.__next_f.push`). The raw payload structure contains:
```json
{
  "productId": "cmokyg7rh000004jrq3xyf15i",
  "initialData": {
    "product": {
      "id": "cmokyg7rh000004jrq3xyf15i",
      "title": "HCM202_SP26_B5FE_915637",
      "description": "HOLA",
      "price": 0,
      "category": "SOURCE_EXAM",
      "examType": "FE",
      "subjectCode": "HCM202",
      "subject": { "code": "HCM202", "name": "Tư tưởng Hồ Chí Minh" },
      "seller": { "id": "...", "name": "...", "username": "...", "trustScore": 0 },
      "createdAt": "$D2026-04-30T03:59:33.197Z",
      "isActive": true
    },
    "hasAccess": true,
    "accessReason": "subscription",
    "campaign": { "active": false },
    "questions": [
      {
        "id": "q_1777521494390_0_szpb41bqq",
        "text": "Theo Hồ Chí Minh...",
        "options": [
          { "id": "A", "text": "Cách mạng Trung Quốc" },
          { "id": "B", "text": "Cách mạng Ấn Độ" },
          { "id": "C", "text": "Cách mạng tháng Mười Nga" },
          { "id": "D", "text": "Cách mạng Pháp" }
        ],
        "imageUrl": null,
        "correctAnswers": ["C"],
        "correctAnswersCount": 1
      }
    ]
  }
}
```

### B. Critical Control Character Unescaping Rule
- **Vulnerability**: `self.__next_f.push` JS string wrappers encode quotes as `\"` and backslashes as `\\`. Question and option text strings contain escaped newline characters formatted as `\n` inside the JSON string literal.
- **Rule**: When unescaping the outer JS string before passing candidate strings to `JSON.parse()`, **DO NOT replace `\\n` with a raw ASCII 10 (`0x0A`) newline character**.
- **Reason**: RFC 8259 forbids raw unescaped control characters (`0x00`-`0x1F`) inside JSON string literals. Converting `\n` to raw `0x0A` causes `JSON.parse()` to throw `SyntaxError: Bad control character in string literal in JSON`.
- **Correct Unescaping Code**:
  ```typescript
  const unescaped = escaped
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
  // DO NOT run .replace(/\\n/g, '\n') before JSON.parse()
  ```

### C. Attribute & Field Resolution
- **Campus**: Extracted from `product.description` (e.g. `"HOLA"`, `"XAVALO"`, `"FPTU Hà Nội"`). Fallback: `'XAVALO'`.
- **Exam Type**: Extracted from `product.examType` (e.g. `"FE"`, `"PE"`, `"RE"`). Fallback: `parseExamCode(title).examType`.
- **Exam Session Date**: Extracted from `product.createdAt` or `product.examSessionDate` after stripping Next.js `$D` ISO prefix (`sanitizeRscDate()`).
- **Options**: Array of choice objects `[{ id: "A", text: "..." }, ...]`. Supports 3, 4, or 5 options per question.
- **Correct Answers**: String array `correctAnswers: ["C"]` (single choice) or `["A", "B", "C"]` (multiple choice).



## 6. Language Exams (TRS, ENW, ENM), verified live on 2026-09-28

Title suffixes mark the skill: `_R` Reading, `_W` Writing, `_RW` Reading and Writing paper, `_VG` Vocabulary and Grammar.

| Shape | Payload | Example |
|---|---|---|
| Reading | `questions` (4-option MC) plus `readingPassages: [{ id, text: "$1b", imageUrl, fromQuestion, toQuestion }]`, `isLanguageExam: true`; the passage body is a separate RSC text row `1b:T13a0,<5024 bytes>` | `TRS501_SU26_H2_RE_R_748358` (`cmtqzfgtf000204litvd5o0kt`) |
| Writing | no `questions`; `product.examType: "PE"`; paper at `initialData.examUrl` (`/api/exams/pdf?productId=<cuid>`); no answer key | `TRS501_SU26_H2_RE_W_185912`, `ENW493c_SU26_RE_W_822365` |
| Vocabulary and Grammar | plain MC with `__________` blanks | `TRS501_SU26_H2_RE_VG_932915` |

RSC encoding rules seen here: missing values are the string `"$undefined"`; `$<id>` values point to `<id>:T<hex byte length>,` text rows that have no terminator. When the exam page is reached by in-app navigation, the saved HTML holds the previous route's payload (`initialProducts`) and no exam data; only a reload or a `?_rsc=1` fetch returns `initialData`.

Fixtures: `docs/webfetches/examview/language/TRS501_reading-rsc.html` (reconstructed from the live payload, byte-identical question JSON and passage length), `TRS501_writing-rsc.html` (verbatim push), and the SPA capture `docs/webfetches/examview/examplehtml-examview-readwrite.html`.

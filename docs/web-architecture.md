# Investigative Web Architecture: fustation.net & Extension Stack

## 1. Extension Tech Stack
- **Framework & Language**: React 18 + TypeScript (React TS).
- **Extension Standard**: Chromium Extension Manifest V3 (MV3).
- **Bundler & Build Tooling**: Vite with TypeScript compiler (`tsc`) outputting to `/dist`.
- **Styling**: Tailwind CSS / Vanilla CSS with Glassmorphism design tokens (`backdrop-filter: blur(28px)`).
- **Accessibility**: Radix-style ToggleGroup (`role="radiogroup"` / `role="radio"`) with keyboard arrow-key navigation and `:focus-visible` offset rings.

---

## 2. Server Component Streaming & Data Hydration

### A. Next.js RSC Data Payload (`self.__next_f`)
- `fustation.net` streams initial page state inside inline `<script>` tags executing `self.__next_f.push([1, "..."])`.
- On exam pages (`/marketplace/exam/[id]`), chunk entry `d:` contains the complete `initialData` object:

```json
{
  "product": {
    "id": "cmol4jwyh000004i3rxquc7sa",
    "title": "MLN122_SP26_B5FE_915637",
    "description": "XAVALO",
    "price": 0,
    "category": "SOURCE_EXAM",
    "examType": "FE",
    "subjectCode": "MLN122",
    "subject": {
      "code": "MLN122",
      "name": "Kinh tế chính trị Mác - Lênin"
    }
  },
  "hasAccess": true,
  "accessReason": "subscription",
  "questions": [
    {
      "id": "q_1777531136180_0_sk03ztva8",
      "text": "Mâu thuẫn cơ bản của sản xuất hàng hóa là gì?",
      "options": [
        { "id": "A", "text": "Mâu thuẫn giữa lao động tư nhân và lao động xã hội" },
        { "id": "B", "text": "Mâu thuẫn giữa lao động cụ thể và lao động trừu tượng" },
        { "id": "C", "text": "Mâu thuẫn giữa giá trị sử dụng và giá trị" },
        { "id": "D", "text": "Mâu thuẫn giữa giá trị và giá cả hàng hóa" }
      ],
      "imageUrl": null,
      "correctAnswers": ["A"],
      "correctAnswersCount": 1
    }
  ]
}
```

### B. React TS Extension Content Script Flow
- Content Script (`src/content.tsx`) mounts a React root inside a Shadow DOM / isolated container (`#fustation-tool-root`).
- Parses `document.scripts` for `self.__next_f` payloads containing `initialData.questions`.
- Provides instant `<50ms` extraction without DOM manipulation.

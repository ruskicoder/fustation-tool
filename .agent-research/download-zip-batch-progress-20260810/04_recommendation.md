# Architecture & Implementation Recommendation

## Recommendation: Approach A

We recommend **Approach A: Volume Batch Partitioning (50 items/zip) with Universal `manifest.md`, 3-Attempt Network Retry, and Slide-Up Progress Footer UI**.

---

## Technical Design Specifications

### 1. Volume Partitioning & Naming
- If `totalItems <= 50`: Generate single archive named `fustation_export_[DDMMYYYY].zip`.
- If `totalItems > 50`: Slice items into chunks of 50. Generate archives named:
  - `fustation_export_[DDMMYYYY]_part1.zip`
  - `fustation_export_[DDMMYYYY]_part2.zip`
  - `fustation_export_[DDMMYYYY]_part3.zip`, etc.

### 2. Universal Manifest File (`manifest.md`)
Placed at the root directory of EVERY exported zip archive (single volume and multi-part volumes).

**Formatting Standard**:
```markdown
# [Title] Part X

## Examsets in this part:

1. [FE] SubjectCode_Title:
   Assets: none

2. [FE] SubjectCode_Title:
   Assets:
     Image [24]: Missing: https://www.fustation.net/api/...

3. [PE] SubjectCode_Title:
   Assets:
     PDF: Available
     ZIP: missing: https://www.fustation.net/api/...
```

### 3. Network Fetcher with Retry & Event Loop Pauses
- Implement `fetchArrayBufferWithRetry(url, retries = 3, delayMs = 500)`:
  - Tries up to 3 times before recording an asset as `missing`.
  - Backs off by `delayMs` on each attempt.
- Insert micro-pauses (`await new Promise(r => setTimeout(r, 10))`) between item processing to keep UI rendering smoothly.

### 4. Slide-Up Progress Footer UI
- **Location**: Rendered inside `SavedTab.tsx` / `Overlay.tsx`.
- **Behavior**: Default `display: none` (or CSS translated down `transform: translateY(100%)`).
- **Trigger**: Slides up smoothly from the bottom when batch download starts.
- **Content**:
  - Item counter: `Processing exam 12 of 120`
  - Volume counter: `Creating Part 1 of 3 (50 items/part)`
  - Visual Progress Bar (0% to 100% animated fill)
  - Current item title preview
- **Dismissal**: Slides down and auto-hides 2 seconds after batch export completes.

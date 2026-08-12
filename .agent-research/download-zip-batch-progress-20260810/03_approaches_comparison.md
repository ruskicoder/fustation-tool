# Candidate Approaches Comparison

## Overview of Candidate Approaches

| Feature / Criteria | Approach A (Recommended): Volume Batch Partitioning (50/zip) + Universal `manifest.md` + Slide-Up Footer UI | Approach B: Monolithic Zip with Dynamic Memory Streaming | Approach C: Web Worker Thread Offloading |
|---|---|---|---|
| **Volume Chunking** | Splits into 50-item parts (`_part1.zip`, `_part2.zip`) if >50 exams | Single massive ZIP file | Single massive ZIP file |
| **Audit Manifest (`manifest.md`)** | Included in ALL zips with detailed asset status & fallback links | Optional / Single list | Optional / Single list |
| **Network Resilience** | 3 retries with 500ms backoff per asset fetch | Single fetch or naive retries | Naive retries inside worker |
| **UI Non-blocking** | Event loop pauses (`setTimeout`) between item batches | Blocks during final blob generation | Fully offloaded to background worker |
| **Progress Feedback** | Dedicated slide-up progress footer with real-time status bar | Header status pill only | Message posting to UI header |
| **Browser Stability** | High (bounded memory per batch, <50MB RAM per zip) | Low (can OOM browser on 150+ exams) | Moderate (Worker memory limits) |
| **Implementation Effort** | Medium | Medium-High | High |

---

## Detailed Evaluation of Approach A (Recommended)

### Implementation Mechanics
1. **Partitioning**:
   - `≤ 50 items`: `fustation_export_[DDMMYYYY].zip`
   - `> 50 items`: `fustation_export_[DDMMYYYY]_part1.zip`, `fustation_export_[DDMMYYYY]_part2.zip`, etc.
2. **Universal Manifest (`manifest.md`)**:
   - Added at the root of EVERY exported ZIP archive (both single volume and sequential parts).
   - Audits each examset: tagged `[FE]` or `[PE]`.
   - Records status of PDF, ZIP answer key, and question images. If missing after 3 retries, includes `Missing: [direct download link]`.
3. **Network Resilience**:
   - `fetchWithRetry(url, retries=3, delay=500ms)` handles network dropouts gracefully.
4. **Slide-Up Progress Footer**:
   - An on-demand footer in `SavedTab.tsx` (and `Overlay.tsx`) that slides up from the bottom when download starts.
   - Shows progress bar (`X / Y items`), current volume (`Part 1 of 2`), current exam title, and auto-hides upon completion.

### Pros
- Eliminates browser tab lag and memory spikes.
- Guarantees complete audit transparency with inline direct links for any failed assets.
- Provides clear visual feedback so users know zipping is active.

### Cons / Trade-offs
- Multiple zip files generated for >50 items (user receives multiple browser download prompts).

# Research Sources & Technical Standards

## 1. JSZip Memory & Non-Blocking Event Loop Management
- **Source**: JSZip Official Documentation & API Reference (`stuk.github.io/jszip`)
- **Authority**: Primary library documentation for client-side zip creation.
- **Key Finding**: `JSZip.generateAsync({ type: "blob" })` loads all files into memory before compression. When handling large asset volumes (>50 files with PDFs/images), memory consumption scales linearly. Splitting into partitioned batches (<=50 items per volume) bounds heap memory allocation.
- **UI Non-blocking**: Inserting `await new Promise(resolve => setTimeout(resolve, 10))` between batch processing ticks allows the Chrome rendering engine to update progress UI and process user events.

## 2. Chrome Extension & Browser Fetch Resilience
- **Source**: MDN Web Docs & W3C Fetch Specification
- **Authority**: Web Standard APIs & Network Protocols.
- **Key Finding**: Network requests under heavy batch load (100+ concurrent/sequential fetches) can fail due to rate limits or transient TCP resets. Implementing a 3-attempt retry strategy with a 500ms delay between retries eliminates transient 503/429 failures.

## 3. Comprehensive Audit Manifest (`manifest.md`)
- **Source**: Standard Archive Packaging & Compliance Guidelines
- **Authority**: Asset Preservation Standards.
- **Key Finding**: Including an inline `manifest.md` audit file at the root of every exported zip volume provides a transparent record of all bundled exams, asset availability, and direct fallback download links for any asset that failed network retrieval.

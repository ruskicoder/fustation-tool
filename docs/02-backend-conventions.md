# 02 Backend Conventions: Data Pipeline & Platform Contracts

`fustation-tool` has no server. In this project "backend" means the non-UI data pipeline under `src/utils/`, the service worker, and the `fustation.net` endpoints they consume with the user's session cookies. Endpoint verification steps live in `specs/fustation-tool/fullstack/api-design/00-verification-guide.md`.

## 1. Consumed Platform Endpoints

All requests go to `https://www.fustation.net` and rely on the logged-in session (`credentials: 'include'` or `'same-origin'`). The extension never sends credentials of its own.

| Endpoint | Caller | Returns | Used for |
|---|---|---|---|
| `GET /marketplace/exam/{cuid}?_rsc=1` | `batchFetcher.fetchExamDatasetDirect`, `exporter.fetchFreshPeZipUrl` | RSC flight stream | batch exam fetch, fresh presigned PE ZIP URL |
| `GET /marketplace/{cuid}?_rsc=1` | `exporter.fetchFreshPeZipUrl` (fallback, ISSUE-84) | RSC flight stream | same, for the short route |
| `GET /marketplace/exam/{cuid}` and `/marketplace/{cuid}` | fallbacks of the two rows above | HTML with inline `self.__next_f.push` chunks | same |
| `GET /home` (and `/subject/...` catalog pages) | batch discovery via `extractProductTasksFromHtml` | HTML with product cards and marketplace links | discovering exam CUIDs (357 on the full-fetch fixture) |
| `GET /api/exams/pdf?productId={id}` | `exporter.resolveValidPdfUrl`, `downloadPdfAsset`, `ViewerPanel` | PDF | PE paper download and embedded preview |
| `GET /api/exams/question-image?key={s3Key}` | `images.normalizeImageUrl`, `fetchImageAsBase64` | image bytes | proxy for S3 question images (direct S3 is blocked) |
| presigned S3 ZIP URL (from RSC payload) | `exporter.fetchArrayBufferWithFastRetry` | ZIP | PE answer key; on HTTP 403 the URL is refreshed via the RSC endpoint |

## 2. Pipeline Stages

1. **Extract** (`parser.ts`): `extractExamFromScripts` reads `self.__next_f` chunks from the live DOM; `unescapeNextFChunk` + `tryParsePartialJson` recover `initialData`; `formatExamDataset` normalizes into `ExamDataset`; `extractPeFromDOM` / `extractPeZipUrl` handle PE sets. The DOM crawler (`crawlExamFromDOM`) is deprecated and isolated as a last-resort fallback (ISSUE-43).
2. **Orchestrate single fetch** (`Overlay.tsx` `runFetch`): Phase 1 instant parse, Phase 2 polling retry 300 ms x10, Phase 3 one guarded reload per exam URL (`fustation_reload_attempted`), Phase 4 surface error.
3. **Batch fetch** (`batchFetcher.ts` `BatchFetchManager` singleton): discover tasks, optional preview fetch of N items, then full fetch with pause/stop; state persisted in `fustation_batch_state`.
4. **Persist** (`storage.ts`): `saveExamToStorage` with `normalizeSavedDataset`; writes are serialized to avoid the concurrent overwrite fixed in ISSUE-72.
5. **Enrich** (`images.ts`, `math.ts`): images normalized to the proxy and embedded as base64; LaTeX sanitized by `sanitizeMathLatex`: escaped and unpairable (currency) `$` become the literal `\uE000` marker, malformed `$$x$` is repaired, then KaTeX renders (MathML-only for exported HTML).
6. **Compile & export** (`compiler.ts`, `exporter.ts`): `exportExam` routes MD (`compileMarkdown`), PDF (`generatePrintHtml` + `window.print()`, HTML download fallback when pop-ups are blocked), JSON; `exportSinglePe` for PE assets; `exportBulkAsZip` builds 10-item JSZip volumes (`fustation_export_ddmmyyyy_partX.zip`) with a `manifest.md` audit per volume.

## 3. Pipeline Rules

- Parse, never guess: a dataset is valid only when `isValidExtractedDataset` passes (FE has questions, PE has assets). Partial results carry `isPartial` and fetch counters instead of dummy placeholders.
- Do not replace `\\n` with a raw newline before `JSON.parse` on RSC chunks (see `00-system-context.md` section 5.B).
- Presigned S3 URLs expire. Store them, but always be ready to refresh through the RSC endpoint before reporting an asset as missing.
- Network helpers retry with backoff and jitter; every failure is logged and surfaced through a toast or the batch log drawer, never swallowed.
- `chrome.downloads` is not available to content scripts. Downloads use blob anchors; anything needing `chrome.downloads` must be delegated to the service worker by message.

## 4. Error Taxonomy

| Class | Example | Handling |
|---|---|---|
| Payload not ready | RSC chunks still streaming | Phase 2 polling, then Phase 3 reload |
| Access denied | `hasAccess: false`, empty question list | error status plus toast; no retry loop |
| Asset expired | S3 HTTP 403 | refresh URL via RSC, retry |
| Asset missing | 404 PDF or ZIP | mark `Missing` in `manifest.md` audit, continue batch |
| Storage failure | `chrome.runtime.lastError` on write | log and toast; the in-memory dataset is kept |

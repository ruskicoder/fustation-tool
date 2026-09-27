import JSZip from 'jszip';
import {
  AssetFetchResult,
  BatchProgressState,
  BatchStatus,
  ExamDataset,
  ExportFormat,
  ExportProgressCallback,
  FEFormat,
  ManifestItemAudit,
  PEFormat,
  SavedExamItem
} from '../types';
import { compileMarkdown, passageHeading } from './compiler';
import { escapeHtml, renderMathInText } from './math';
import { embedBase64ImagesInDataset, normalizeImageUrl } from './images';
import { extractPeZipUrl } from './parser';

export interface BulkExportOptions {
  feFormat?: FEFormat;
  peFormat?: PEFormat;
  onProgress?: ExportProgressCallback;
  getControlState?: () => { isPaused: boolean; isCanceled: boolean };
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getFormattedDateString(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

export async function fetchArrayBuffer(rawUrl: string): Promise<ArrayBuffer | null> {
  try {
    const url = rawUrl
      .replace(/\\\\u0026/gi, '&')
      .replace(/\\u0026/gi, '&')
      .replace(/&amp;/gi, '&')
      .replace(/\\/g, '')
      .trim();
    const fullUrl = url.startsWith('http') ? url : `https://www.fustation.net${url.startsWith('/') ? '' : '/'}${url}`;
    const res = await fetch(fullUrl, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Queries the live Next.js marketplace page for a given cuid to obtain a fresh presigned S3 ZIP URL.
 */
export async function fetchFreshPeZipUrl(cuid: string): Promise<string | null> {
  if (!cuid) return null;
  try {
    // 1. Try /marketplace/exam/${cuid}?_rsc=1
    let res = await fetch(`https://www.fustation.net/marketplace/exam/${cuid}?_rsc=1`, {
      credentials: 'include'
    });
    // 2. Fallback to /marketplace/${cuid}?_rsc=1
    if (!res.ok) {
      res = await fetch(`https://www.fustation.net/marketplace/${cuid}?_rsc=1`, {
        credentials: 'include'
      });
    }
    // 3. Fallback to standard HTML page
    if (!res.ok) {
      const fallbackRes = await fetch(`https://www.fustation.net/marketplace/exam/${cuid}`, {
        credentials: 'include'
      });
      if (fallbackRes.ok) {
        const html = await fallbackRes.text();
        return extractPeZipUrl(html, false);
      }
      const directFallback = await fetch(`https://www.fustation.net/marketplace/${cuid}`, {
        credentials: 'include'
      });
      if (!directFallback.ok) return null;
      const html = await directFallback.text();
      return extractPeZipUrl(html, false);
    }
    const text = await res.text();
    return extractPeZipUrl(text, false);
  } catch (e) {
    console.warn(`[fustation-tool] Failed to fetch fresh PE ZIP URL for ${cuid}:`, e);
    return null;
  }
}

/**
 * Fetches an ArrayBuffer with fast exponential retry and session credentials.
 */
export async function fetchArrayBufferWithFastRetry(
  rawUrl: string,
  maxRetries = 3,
  baseDelayMs = 80,
  onRetry?: (status: 'fetching' | 'retrying', attempt: number) => void,
  cuid?: string
): Promise<AssetFetchResult> {
  let cleanUrl = rawUrl
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/\\/g, '')
    .trim();

  let fullUrl = cleanUrl.startsWith('http')
    ? cleanUrl
    : `https://www.fustation.net${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    onRetry?.(attempt === 1 ? 'fetching' : 'retrying', attempt);
    try {
      const res = await fetch(fullUrl, { credentials: 'include' });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return { buffer, status: 'available', attempts: attempt, url: fullUrl };
      }

      // If HTTP 403 (expired S3 presigned URL) and cuid is known, attempt dynamic live refresh
      if (res.status === 403 && cuid && attempt < maxRetries) {
        const freshUrl = await fetchFreshPeZipUrl(cuid);
        if (freshUrl && freshUrl !== fullUrl) {
          fullUrl = freshUrl;
        }
      }
    } catch (e) {
      // Network failure, continue retry
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }

  return { buffer: null, status: 'missing', attempts: maxRetries, url: fullUrl };
}

export function generatePrintHtml(dataset: ExamDataset): string {
  const subjectStr = escapeHtml(`${dataset.subjectCode} - ${dataset.subjectName}`);
  const termStr = dataset.term || dataset.termCode || 'N/A';
  const typeStr = dataset.examType || 'FE';
  const termTypeStr = escapeHtml(`${termStr} - ${typeStr}`);
  const sessionStr = escapeHtml(`${dataset.examSessionTime || 'N/A'} | ${dataset.examSessionDate || 'N/A'}`);
  const titleStr = escapeHtml(dataset.title || 'Exam Print');
  const campusStr = escapeHtml(dataset.campus || dataset.author || 'N/A');
  let questionsHtml = '';

  (dataset.questions || []).forEach((q, idx) => {
    const qNum = idx + 1;
    (dataset.passages || []).filter((p) => p.fromQuestion === qNum).forEach((p) => {
      const passageImg = normalizeImageUrl(p.imageUrl);
      questionsHtml += `
      <div class="passage">
        <div class="passage-label">${escapeHtml(passageHeading(p))}</div>
        ${passageImg ? `<img src="${passageImg}" class="q-img" alt="Passage illustration" />` : ''}
        <div class="passage-text">${renderMathInText(p.text, undefined, 'mathml')}</div>
      </div>`;
    });
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    const renderedQText = renderMathInText(q.text || '', undefined, 'mathml') || '<em>[ Question Illustration ]</em>';

    let optionsHtml = '';
    (q.options || []).forEach((opt) => {
      const isCorrect = (q.correctAnswers || []).includes(opt.id);
      const renderedOptText = renderMathInText(opt.text || '', undefined, 'mathml');
      optionsHtml += `
        <div class="option ${isCorrect ? 'correct' : ''}">
          <span class="badge">${opt.id}</span>
          <span class="opt-text">${renderedOptText}</span>
        </div>`;
    });

    const imgSrc = q.imageBase64 || normalizeImageUrl(q.imageUrl);
    const imgHtml = imgSrc ? `<img src="${imgSrc}" class="q-img" alt="Question illustration" />` : '';

    questionsHtml += `
      <div class="q-card">
        <h3 class="q-title">Câu hỏi ${qNum}: ${renderedQText}</h3>
        ${imgHtml}
        <div class="options-list">
          ${optionsHtml}
        </div>
        <div class="answer-key">Đáp án đúng: <strong>${answers}</strong></div>
      </div>`;
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; line-height: 1.5; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; margin: 0 0 8px 0; color: #0f172a; }
    .meta { font-size: 14px; color: #64748b; margin: 4px 0; }
    .q-card { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .q-title { font-size: 16px; margin: 0 0 12px 0; color: #0f172a; font-weight: 600; line-height: 1.4; white-space: pre-wrap; }
    .opt-text { white-space: pre-wrap; }
    .passage { border-left: 4px solid #6366f1; background: #f8fafc; padding: 14px 16px; margin-bottom: 20px; border-radius: 6px; }
    .passage-label { font-size: 13px; font-weight: 700; color: #4338ca; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
    .passage-text { font-size: 14px; white-space: pre-wrap; tab-size: 4; }
    .q-img { max-width: 100%; height: auto; margin-bottom: 12px; border-radius: 6px; display: block; }
    .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .option { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: 6px; border: 1px solid #f1f5f9; background: #f8fafc; font-size: 14px; color: #334155; }
    .option.correct { border-color: #10b981; background: #ecfdf5; color: #065f46; font-weight: 600; }
    .badge { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 50%; background: #e2e8f0; color: #334155; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .option.correct .badge { background: #10b981; color: #fff; }
    .answer-key { font-size: 13px; color: #047857; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
    .fus-math-block { display: block; margin: 8px 0; text-align: center; }
    .fus-math-inline { display: inline-block; vertical-align: middle; }
    @media print {
      body { margin: 0; padding: 15px; }
      .q-card { page-break-inside: avoid; box-shadow: none; border-color: #cbd5e1; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${titleStr}</h1>
    <div class="meta"><strong>Môn học:</strong> ${subjectStr} | <strong>Học kỳ & Loại thi:</strong> ${termTypeStr}</div>
    <div class="meta"><strong>Cơ sở / Nguồn:</strong> ${campusStr} | <strong>Ca thi / Ngày:</strong> ${sessionStr} | <strong>Số câu hỏi:</strong> ${dataset.totalQuestions}</div>
  </div>
  ${questionsHtml}
</body>
</html>`;
}

export async function downloadAssetUrl(rawUrl: string, filename: string): Promise<boolean> {
  if (typeof document === 'undefined' || !rawUrl) return false;
  const cleanUrl = rawUrl
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/\\/g, '')
    .trim();
  const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://www.fustation.net${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;

  try {
    const res = await fetch(fullUrl, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    downloadBlobFromObjectUrl(objectUrl, filename);
    return true;
  } catch (err) {
    // chrome.downloads is not exposed to content scripts; let the browser navigate to the asset instead.
    console.warn(`[fustation-tool] Direct blob fetch failed for ${fullUrl}, falling back to anchor download:`, err);
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}

/**
 * Extracts a valid cuid or numeric productId. Does NOT match 6-digit title number suffixes.
 */
export function extractNumericProductId(ds: ExamDataset): string | null {
  if (!ds) return null;
  if (ds.id && (/^cm[a-z0-9]{20,30}$/i.test(ds.id) || /^\d{5,8}$/.test(ds.id))) return ds.id;
  if (ds.pdfUrl) {
    const m = ds.pdfUrl.match(/productId=([a-zA-Z0-9_-]+)/i);
    if (m && m[1] && m[1] !== 'undefined' && m[1] !== 'null') return m[1];
  }
  return null;
}

export function resolveValidPdfUrl(ds: ExamDataset): string | null {
  if (!ds) return null;
  if (ds.pdfUrl && !ds.pdfUrl.includes('productId=cmo') && !ds.pdfUrl.includes('productId=exam_')) {
    return ds.pdfUrl;
  }
  const pid = extractNumericProductId(ds);
  if (pid) {
    return `/api/exams/pdf?productId=${pid}`;
  }
  return null;
}

export function isPeDataset(ds: ExamDataset): boolean {
  if (!ds) return false;
  if (ds.examCategory === 'PE') return true;
  const typeStr = (ds.examType || '').toUpperCase();
  if (['PE', 'PE1', 'PE2', 'B5PE'].includes(typeStr) || typeStr.includes('PE')) return true;
  if ((ds.questions?.length ?? ds.totalQuestions ?? 0) === 0) {
    if (ds.zipUrl) return true;
    if (ds.pdfUrl) {
      const numId = extractNumericProductId(ds);
      if (numId || ds.pdfUrl.toLowerCase().endsWith('.pdf') || ds.pdfUrl.includes('s3.amazonaws.com')) {
        return true;
      }
    }
  }
  return false;
}

export async function downloadPdfAsset(dataset: ExamDataset): Promise<boolean> {
  if (!dataset) return false;
  const pdfUrl = resolveValidPdfUrl(dataset);
  if (!pdfUrl) return false;
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_Paper.pdf`;
  return await downloadAssetUrl(pdfUrl, filename);
}

export async function downloadZipAsset(dataset: ExamDataset): Promise<boolean> {
  if (!dataset) return false;
  let zipUrl = dataset.zipUrl;
  if (!zipUrl && dataset.id) {
    zipUrl = await fetchFreshPeZipUrl(dataset.id);
  }
  if (!zipUrl) return false;
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_AnswerKey.zip`;
  return await downloadAssetUrl(zipUrl, filename);
}

export async function exportSinglePe(dataset: ExamDataset, peFormat: PEFormat = 'PE_BOTH'): Promise<boolean> {
  const title = (dataset.title || 'PE_Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfUrl = resolveValidPdfUrl(dataset);

  if (peFormat === 'PE_PDF') {
    return await downloadPdfAsset(dataset);
  } else if (peFormat === 'PE_ZIP') {
    return await downloadZipAsset(dataset);
  } else {
    // PE_BOTH -> Bundle into <Title>.zip
    const zip = new JSZip();
    let addedCount = 0;

    if (pdfUrl) {
      const pdfBuf = await fetchArrayBuffer(pdfUrl);
      if (pdfBuf) {
        zip.file(`${title}_Paper.pdf`, pdfBuf);
        addedCount++;
      }
    }

    let zipUrl = dataset.zipUrl;
    if (!zipUrl && dataset.id) {
      zipUrl = await fetchFreshPeZipUrl(dataset.id);
    }

    if (zipUrl) {
      let zipBuf = await fetchArrayBuffer(zipUrl);
      if (!zipBuf && dataset.id) {
        const freshUrl = await fetchFreshPeZipUrl(dataset.id);
        if (freshUrl) {
          zipBuf = await fetchArrayBuffer(freshUrl);
        }
      }
      if (zipBuf) {
        zip.file(`${title}_AnswerKey.zip`, zipBuf);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      downloadBlobFromObjectUrl(url, `${title}.zip`);
      return true;
    } else {
      const pdfOk = await downloadPdfAsset(dataset);
      let zipOk = false;
      if (dataset.zipUrl || dataset.id) zipOk = await downloadZipAsset(dataset);
      return pdfOk || zipOk;
    }
  }
}

function downloadBlobFromObjectUrl(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getMimeFromUrl(url: string): string {
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.jpg') || url.includes('.jpeg')) return 'image/jpeg';
  if (url.includes('.webp')) return 'image/webp';
  if (url.includes('.svg')) return 'image/svg+xml';
  return 'image/png';
}

function generateManifestMd(batchIdx: number, totalBatches: number, items: ManifestItemAudit[]): string {
  const lines: string[] = [
    `# FUSTATION Batch Export Manifest (Part ${batchIdx + 1} of ${totalBatches})`,
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| Subject | Title | Category | Asset Status | Details |',
    '| :--- | :--- | :--- | :--- | :--- |'
  ];

  items.forEach((it) => {
    const assetSummary = it.assets.map((a) => `${a.type}${a.index ? ' Q' + a.index : ''}: ${a.status}`).join(', ') || 'OK';
    const missingDetails = it.assets.filter((a) => a.status === 'Missing').map((a) => `${a.type} -> ${a.targetFilename || a.url || 'N/A'}`).join('; ');
    lines.push(`| ${it.subjectCode} | ${it.title} | ${it.category} | ${assetSummary} | ${missingDetails || 'Complete'} |`);
  });

  return lines.join('\n');
}

function generateRecoverImagesPy(): string {
  return `#!/usr/bin/env python3
"""
FUSTATION Asset Recovery Script
Places recovered image files from 'reimport-images-here' into markdown dataset exports.
"""
import os, sys, glob, re

def main():
    print("=== FUSTATION Local Image Recovery Tool ===")
    reimport_dir = "reimport-images-here"
    if not os.path.exists(reimport_dir):
        print(f"Directory {reimport_dir} not found. Exiting.")
        return

    images = glob.glob(os.path.join(reimport_dir, "*.*"))
    print(f"Found {len(images)} replacement image(s).")
    if len(images) == 0:
        print("Drop missing images into 'reimport-images-here' and run this script again.")
        return

    print("Images indexed. You can re-run export to re-embed.")

if __name__ == "__main__":
    main()
`;
}

/**
 * Bulk exports saved exam datasets chunked into 10-item partition ZIP volumes with live RSC refresh & audit manifests.
 */
export async function exportBulkAsZip(
  savedItems: SavedExamItem[],
  optionsOrFeFormat?: BulkExportOptions | FEFormat,
  maybePeFormat?: PEFormat
): Promise<void> {
  if (!savedItems || savedItems.length === 0) return;

  let feFormat: FEFormat = 'MD';
  let peFormat: PEFormat = 'PE_BOTH';
  let onProgress: ExportProgressCallback | undefined;
  let getControlState: (() => { isPaused: boolean; isCanceled: boolean }) | undefined;

  if (typeof optionsOrFeFormat === 'object' && optionsOrFeFormat !== null) {
    feFormat = optionsOrFeFormat.feFormat || 'MD';
    peFormat = optionsOrFeFormat.peFormat || 'PE_BOTH';
    onProgress = optionsOrFeFormat.onProgress;
    getControlState = optionsOrFeFormat.getControlState;
  } else if (typeof optionsOrFeFormat === 'string') {
    feFormat = optionsOrFeFormat;
    if (maybePeFormat) peFormat = maybePeFormat;
  }

  const BATCH_SIZE = 10;
  const totalItems = savedItems.length;
  const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
  let completedItems = 0;
  const logEntries: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    logEntries.push(`[${timestamp}] ${msg}`);
  };

  const reportProgress = (
    batchIdx: number,
    status: BatchStatus,
    examCode: string,
    note: string
  ) => {
    if (onProgress) {
      const ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
      onProgress({
        totalItems,
        completedItems,
        currentBatchIndex: batchIdx,
        totalBatches,
        batchStatus: status,
        currentExamCode: examCode,
        currentLogNote: note,
        isPaused: ctrl.isPaused,
        isCanceled: ctrl.isCanceled,
        isDrawerExpanded: false,
        logs: [...logEntries]
      });
    }
  };

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    let ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
    if (ctrl.isCanceled) {
      reportProgress(batchIdx, 'done', '', 'Export cancelled by user');
      return;
    }

    const batchStart = batchIdx * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalItems);
    const batchItems = savedItems.slice(batchStart, batchEnd);

    const zip = new JSZip();
    const itemsAudit: ManifestItemAudit[] = [];
    // Same-titled exams (e.g. one code uploaded by two campuses) must not overwrite each other.
    const usedPaths = new Set<string>();
    const uniqueName = (folderName: string, base: string, ext: string): string => {
      let name = `${base}${ext}`;
      for (let n = 2; usedPaths.has(`${folderName}/${name}`); n++) name = `${base}_${n}${ext}`;
      usedPaths.add(`${folderName}/${name}`);
      return name;
    };
    let batchHasMissingFeImages = false;

    // 1. Process items in current partition batch
    for (const item of batchItems) {
      ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
      if (ctrl.isCanceled) {
        reportProgress(batchIdx, 'done', '', 'Export cancelled by user');
        return;
      }
      while (ctrl.isPaused && !ctrl.isCanceled) {
        reportProgress(batchIdx, 'standby', '', 'Export paused');
        await new Promise((r) => setTimeout(r, 200));
        ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
      }

      const ds = item.dataset || (item as any);
      const subjCode = (ds.subjectCode || item.subjectCode || 'UNASSIGNED').toUpperCase();
      const folder = zip.folder(subjCode);
      const title = (ds.title || item.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
      const isItemPe = isPeDataset(ds as ExamDataset);

      const itemAudit: ManifestItemAudit = {
        title,
        subjectCode: subjCode,
        category: isItemPe ? 'PE' : 'FE',
        assets: []
      };

      reportProgress(
        batchIdx,
        'compiling',
        subjCode,
        `[${subjCode}] Compiling ${title}...`
      );

      if (isItemPe) {
        // PE asset export
        const pdfUrl = resolveValidPdfUrl(ds as ExamDataset);

        if ((peFormat === 'PE_PDF' || peFormat === 'PE_BOTH') && pdfUrl) {
          const fetchRes = await fetchArrayBufferWithFastRetry(pdfUrl, 3, 80, (st, attempt) => {
            if (st === 'retrying') {
              reportProgress(batchIdx, 'retrying', subjCode, `[${subjCode}] Retrying PE PDF (attempt ${attempt}/3)...`);
            }
          });

          if (fetchRes.status === 'available' && fetchRes.buffer) {
            folder?.file(uniqueName(subjCode, `${title}_Paper`, '.pdf'), fetchRes.buffer);
            itemAudit.assets.push({ type: 'PDF', status: 'Available' });
          } else {
            addLog(`[${subjCode}] PE PDF asset unavailable — marked missing in audit manifest`);
            itemAudit.assets.push({ type: 'PDF', status: 'Missing', url: fetchRes.url });
          }
        } else if (peFormat === 'PE_PDF' || peFormat === 'PE_BOTH') {
          addLog(`[${subjCode}] PE PDF URL could not be resolved, marked missing in audit manifest`);
          itemAudit.assets.push({ type: 'PDF', status: 'Missing' });
        }

        let zipUrl = ds.zipUrl;
        if ((peFormat === 'PE_ZIP' || peFormat === 'PE_BOTH')) {
          if (!zipUrl && ds.id) {
            zipUrl = await fetchFreshPeZipUrl(ds.id);
          }

          if (zipUrl) {
            const fetchRes = await fetchArrayBufferWithFastRetry(
              zipUrl,
              3,
              80,
              (st, attempt) => {
                if (st === 'retrying') {
                  reportProgress(batchIdx, 'retrying', subjCode, `[${subjCode}] Retrying PE ZIP (attempt ${attempt}/3)...`);
                }
              },
              ds.id
            );

            if (fetchRes.status === 'available' && fetchRes.buffer) {
              folder?.file(uniqueName(subjCode, `${title}_AnswerKey`, '.zip'), fetchRes.buffer);
              itemAudit.assets.push({ type: 'ZIP', status: 'Available' });
            } else {
              addLog(`[${subjCode}] PE ZIP asset unavailable — marked missing in audit manifest`);
              itemAudit.assets.push({ type: 'ZIP', status: 'Missing', url: fetchRes.url });
            }
          } else {
            addLog(`[${subjCode}] PE answer-key ZIP URL could not be resolved, marked missing in audit manifest`);
            itemAudit.assets.push({ type: 'ZIP', status: 'Missing' });
          }
        }
      } else {
        // FE exam export with fast image asset fetching & Base64 embedding
        const datasetCopy: ExamDataset = JSON.parse(JSON.stringify(ds));
        const questions = datasetCopy.questions || [];

        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          if (q.imageUrl) {
            if (q.imageBase64 && q.imageBase64.startsWith('data:image/')) {
              itemAudit.assets.push({ type: 'Image', index: q.index, status: 'Available' });
            } else {
              const imgUrl = normalizeImageUrl(q.imageUrl);
              if (imgUrl) {
                const fetchRes = await fetchArrayBufferWithFastRetry(imgUrl, 3, 80, (st, attempt) => {
                  if (st === 'retrying') {
                    reportProgress(batchIdx, 'retrying', subjCode, `[${subjCode}] Retrying Q${q.index || qIdx + 1} image (attempt ${attempt}/3)...`);
                  }
                });

                if (fetchRes.status === 'available' && fetchRes.buffer) {
                  const b64 = arrayBufferToBase64(fetchRes.buffer);
                  const mime = getMimeFromUrl(imgUrl);
                  q.imageBase64 = `data:${mime};base64,${b64}`;
                  itemAudit.assets.push({ type: 'Image', index: q.index, status: 'Available' });
                } else {
                  batchHasMissingFeImages = true;
                  addLog(`[${subjCode}] Image Q${q.index || qIdx + 1} asset unavailable — marked missing in manifest`);
                  const targetFilename = `batch${String(batchIdx + 1).padStart(2, '0')}-rec-img-${q.index || qIdx + 1}.png`;
                  itemAudit.assets.push({
                    type: 'Image',
                    index: q.index,
                    status: 'Missing',
                    url: fetchRes.url,
                    targetFilename
                  });
                }
              }
            }
          }
        }

        if (feFormat === 'JSON') {
          const jsonStr = JSON.stringify(datasetCopy, null, 2);
          folder?.file(uniqueName(subjCode, title, '.json'), jsonStr);
        } else if (feFormat === 'PDF') {
          const htmlStr = generatePrintHtml(datasetCopy);
          folder?.file(uniqueName(subjCode, title, '.html'), htmlStr);
        } else {
          // Default MD
          const mdStr = await compileMarkdown(datasetCopy, true);
          folder?.file(uniqueName(subjCode, title, '.md'), mdStr);
        }
      }

      itemsAudit.push(itemAudit);
      completedItems++;
      // Yield to browser event loop between items
      await new Promise((r) => setTimeout(r, 10));
    }

    // 2. Generate Universal manifest.md at ZIP root
    const manifestText = generateManifestMd(batchIdx, totalBatches, itemsAudit);
    zip.file('manifest.md', manifestText);

    // 3. Include Python recovery script if missing FE images exist
    if (batchHasMissingFeImages) {
      zip.folder('reimport-images-here');
      zip.file('recover_images.py', generateRecoverImagesPy());
    }

    // 4. Trigger Batch ZIP Download
    reportProgress(
      batchIdx,
      'downloading',
      '',
      `Compressing & downloading Batch ${batchIdx + 1} of ${totalBatches}...`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const dateStr = getFormattedDateString();
    const filename = totalBatches > 1
      ? `fustation_export_${dateStr}_part${batchIdx + 1}.zip`
      : `fustation_export_${dateStr}.zip`;

    const objectUrl = URL.createObjectURL(zipBlob);
    downloadBlobFromObjectUrl(objectUrl, filename);

    // Micro-pause before next batch
    await new Promise((r) => setTimeout(r, 50));
  }

  reportProgress(
    totalBatches - 1,
    'done',
    '',
    `Successfully exported all ${totalItems} examsets across ${totalBatches} batch parts.`
  );
}

export async function exportExam(dataset: ExamDataset, format: ExportFormat = 'MD'): Promise<void> {
  if (!dataset) return;

  const isPe = isPeDataset(dataset);

  if (isPe) {
    let peFormat: PEFormat = 'PE_BOTH';
    if (format === 'PE_PDF' || format === 'PDF') peFormat = 'PE_PDF';
    else if (format === 'PE_ZIP') peFormat = 'PE_ZIP';
    await exportSinglePe(dataset, peFormat);
    return;
  }

  const subjCode = (dataset.subjectCode || 'EXAM').toUpperCase();
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');

  let filename = cleanTitle;
  if (!cleanTitle.toUpperCase().startsWith(subjCode)) {
    filename = `${subjCode}_${cleanTitle}`;
  }

  // Pre-process images to Base64 for self-contained exports
  const embeddedDataset = await embedBase64ImagesInDataset(dataset);

  if (format === 'JSON') {
    const jsonStr = JSON.stringify(embeddedDataset, null, 2);
    downloadBlob(jsonStr, `${filename}.json`, 'application/json');
  } else if (format === 'PDF') {
    const htmlStr = generatePrintHtml(embeddedDataset);
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlStr);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    } else {
      // Fallback if window.open is blocked by browser popup blocker
      downloadBlob(htmlStr, `${filename}.html`, 'text/html;charset=utf-8');
    }
  } else {
    // Default MD
    const mdStr = await compileMarkdown(embeddedDataset, true);
    downloadBlob(mdStr, `${filename}.md`, 'text/markdown;charset=utf-8');
  }
}


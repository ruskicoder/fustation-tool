import JSZip from 'jszip';
import { ExamDataset, ExportFormat, FEFormat, PEFormat, SavedExamItem, AssetFetchResult, ExportProgressCallback, BatchProgressState } from '../types';
import { EXAMSETS_PER_BATCH, ASSET_RETRY_ATTEMPTS, ASSET_RETRY_DELAY_MS } from '../config/constants';
import { compileMarkdown } from './compiler';
import { renderMathInText } from './math';
import { embedBase64ImagesInDataset, normalizeImageUrl } from './images';
import { extractPeZipUrl } from './parser';

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

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getMimeFromUrl(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.gif')) return 'image/gif';
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  if (clean.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

export async function fetchArrayBuffer(rawUrl: string): Promise<ArrayBuffer | null> {
  const result = await fetchArrayBufferWithFastRetry(rawUrl);
  return result.buffer;
}

export async function fetchArrayBufferWithFastRetry(
  rawUrl: string,
  retries = ASSET_RETRY_ATTEMPTS,
  delayMs = ASSET_RETRY_DELAY_MS,
  onStatusChange?: (status: 'attempting' | 'retrying' | 'failed', attempt: number, url: string) => void
): Promise<AssetFetchResult> {
  const url = rawUrl
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/\\/g, '')
    .trim();
  const fullUrl = url.startsWith('http') ? url : `https://www.fustation.net${url.startsWith('/') ? '' : '/'}${url}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt === 1) {
        onStatusChange?.('attempting', attempt, fullUrl);
      } else {
        onStatusChange?.('retrying', attempt, fullUrl);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      const res = await fetch(fullUrl, { credentials: 'include' });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return {
          buffer,
          status: 'available',
          attempts: attempt,
          url: fullUrl
        };
      }
    } catch {
      // Retry on exception
    }
  }

  onStatusChange?.('failed', retries, fullUrl);
  return {
    buffer: null,
    status: 'missing',
    attempts: retries,
    url: fullUrl
  };
}

export interface ManifestAssetAudit {
  type: 'Image' | 'PDF' | 'ZIP';
  index?: number;
  status: 'Available' | 'Missing';
  url?: string;
  targetFilename?: string;
}

export interface ManifestItemAudit {
  title: string;
  subjectCode: string;
  category: 'FE' | 'PE';
  assets: ManifestAssetAudit[];
}

export function generateManifestMd(
  partIndex: number,
  totalParts: number,
  itemsAudit: ManifestItemAudit[]
): string {
  const titleHeader = totalParts > 1 ? `Part ${partIndex + 1} of ${totalParts}` : 'Volume';
  let md = `# Export ${titleHeader}\n\n## Examsets in this part:\n\n`;

  itemsAudit.forEach((item, idx) => {
    const itemNum = idx + 1;
    const catTag = `[${item.category}]`;
    md += `${itemNum}. ${catTag} ${item.subjectCode}_${item.title}:\n`;

    if (!item.assets || item.assets.length === 0) {
      md += `   Assets: none\n`;
    } else {
      md += `   Assets:\n`;
      item.assets.forEach((ast) => {
        if (item.category === 'PE') {
          const statusStr = ast.status === 'Available' ? 'Available' : `missing: ${ast.url || 'N/A'}`;
          md += `     ${ast.type}: ${statusStr}\n`;
        } else {
          // FE Images
          if (ast.status === 'Available') {
            md += `     Image [${ast.index ?? '?' }]: Available\n`;
          } else {
            const prenamedUrl = ast.url ? `${ast.url}${ast.url.includes('?') ? '&' : '?'}filename=${ast.targetFilename || 'rec-img.png'}` : 'N/A';
            md += `     Image [${ast.index ?? '?' }]: Missing: ${prenamedUrl} (Target: reimport-images-here/${ast.targetFilename || 'rec-img.png'})\n`;
          }
        }
      });
    }
  });

  return md;
}

export function generateRecoverImagesPy(): string {
  return `import os
import re
import base64
import sys

def main():
    print("=" * 60)
    print("  FUSTATION EXAM TOOL - MISSING FE IMAGE RECOVERY ASSISTANT  ")
    print("=" * 60)
    print()

    manifest_path = "manifest.md"
    reimport_dir = "reimport-images-here"

    if not os.path.exists(manifest_path):
        print("[ERROR] manifest.md not found in the current directory.")
        input("Press Enter to exit...")
        sys.exit(1)

    if not os.path.exists(reimport_dir):
        os.makedirs(reimport_dir, exist_ok=True)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_text = f.read()

    pattern = re.compile(
        r"Image\\s*\\[(\\d+)\\]:\\s*Missing:\\s*(https?://[^\\s]+)\\s*\\(Target:\\s*reimport-images-here/([^\\)]+)\\)",
        re.IGNORECASE
    )
    matches = pattern.findall(manifest_text)

    if not matches:
        print("[INFO] No missing FE image assets detected in manifest.md.")
        print("All images are fully embedded!")
        input("\\nPress Enter to exit...")
        sys.exit(0)

    print(f"Detected {len(matches)} missing image asset(s) in manifest.md:\\n")
    for idx, (img_num, url, filename) in enumerate(matches, 1):
        print(f"  {idx}. Target Filename: {filename}")
        print(f"     Direct Link    : {url}")
        print()

    print("-" * 60)
    print("INSTRUCTIONS:")
    print("1. Download the images from the links above.")
    print(f"2. Save/move them into the directory: '{reimport_dir}/'")
    print("   (Target filenames are pre-configured in URLs)")
    print("-" * 60)
    print()

    input("==> Press Enter when you have downloaded all images and placed them into the folder...")

    print("\\nScanning 'reimport-images-here/' for target files...")
    found_files = {}
    missing_files = []

    for img_num, url, filename in matches:
        file_path = os.path.join(reimport_dir, filename)
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            found_files[filename] = file_path
        else:
            missing_files.append(filename)

    print(f"\\nVerification Results:")
    print(f"  - Ready for import : {len(found_files)} / {len(matches)}")
    print(f"  - Still missing    : {len(missing_files)}")

    if not found_files:
        print("\\n[WARNING] No downloaded target images found in 'reimport-images-here/'.")
        input("Press Enter to exit...")
        sys.exit(1)

    print("\\n" + "!" * 60)
    print("CONFIRMATION REQUIRED:")
    print("The script will now encode found images to Base64 and inject them inline")
    print("into the corresponding exported HTML files.")
    print("WARNING: THIS OPERATION CANNOT BE UNDONE.")
    print("!" * 60)

    confirm = input("\\nDo you want to proceed? (y/N): ").strip().lower()
    if confirm != 'y':
        print("Operation cancelled.")
        sys.exit(0)

    html_files = []
    for root_dir, dirs, files in os.walk("."):
        for file in files:
            if file.endswith(".html"):
                html_files.append(os.path.join(root_dir, file))
    html_files = list(set(html_files))

    success_count = 0
    fail_count = 0

    for filename, file_path in found_files.items():
        try:
            with open(file_path, "rb") as img_f:
                b64_data = base64.b64encode(img_f.read()).decode("utf-8")

            mime_type = "image/png"
            if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
                mime_type = "image/jpeg"
            elif filename.lower().endswith(".webp"):
                mime_type = "image/webp"

            data_url = f"data:{mime_type};base64,{b64_data}"

            replaced_any = False
            for h_path in html_files:
                with open(h_path, "r", encoding="utf-8", errors="ignore") as hf:
                    h_content = hf.read()

                if filename in h_content or "q-img" in h_content:
                    new_content = re.sub(
                        r'src=["\\'][^"\\']*' + re.escape(filename) + r'[^"\\']*["\\']',
                        f'src="{data_url}"',
                        h_content
                    )
                    if new_content != h_content:
                        with open(h_path, "w", encoding="utf-8") as hf:
                            hf.write(new_content)
                        replaced_any = True

            if replaced_any:
                success_count += 1
            else:
                success_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to process {filename}: {e}")
            fail_count += 1

    print("\\n" + "=" * 60)
    print(f"IMPORT COMPLETE: Success: {success_count}, Failed: {fail_count}")
    print("=" * 60)
    input("\\nPress Enter to exit...")

if __name__ == "__main__":
    main()
`;
}


export function generatePrintHtml(dataset: ExamDataset): string {
  const subjectStr = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const termStr = dataset.term || dataset.termCode || 'SP26';
  const typeStr = dataset.examType || 'FE';
  const termTypeStr = `${termStr} - ${typeStr}`;
  const sessionStr = `${dataset.examSessionTime || 'N/A'} | ${dataset.examSessionDate || '29/04/2026'}`;
  let questionsHtml = '';

  (dataset.questions || []).forEach((q, idx) => {
    const qNum = idx + 1;
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    const renderedQText = renderMathInText(q.text || '') || '<em>[ Question Illustration ]</em>';

    let optionsHtml = '';
    (q.options || []).forEach((opt) => {
      const isCorrect = (q.correctAnswers || []).includes(opt.id);
      const renderedOptText = renderMathInText(opt.text || '');
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
  <title>${dataset.title || 'Exam Print'}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; line-height: 1.5; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; margin: 0 0 8px 0; color: #0f172a; }
    .meta { font-size: 14px; color: #64748b; margin: 4px 0; }
    .q-card { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .q-title { font-size: 16px; margin: 0 0 12px 0; color: #0f172a; font-weight: 600; line-height: 1.4; }
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
    <h1>${dataset.title}</h1>
    <div class="meta"><strong>Môn học:</strong> ${subjectStr} | <strong>Học kỳ & Loại thi:</strong> ${termTypeStr}</div>
    <div class="meta"><strong>Cơ sở / Nguồn:</strong> ${dataset.campus || dataset.author || 'XAVALO'} | <strong>Ca thi / Ngày:</strong> ${sessionStr} | <strong>Số câu hỏi:</strong> ${dataset.totalQuestions}</div>
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
    console.warn(`[fustation-tool] Direct blob fetch failed for ${fullUrl}, falling back:`, err);
    if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({
        url: fullUrl,
        filename: filename,
        saveAs: true
      });
      return true;
    } else {
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
}

export function extractNumericProductId(ds: ExamDataset): string | null {
  if (!ds) return null;
  if (ds.id && /^\d{5,8}$/.test(ds.id)) return ds.id;
  if (ds.pdfUrl) {
    const m = ds.pdfUrl.match(/productId=(\d{5,8})/i);
    if (m && m[1]) return m[1];
  }
  return null;
}

export function isValidNumericPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  const match = trimmed.match(/productId=([^&]+)/i);
  if (match && match[1]) {
    return /^\d{5,8}$/.test(match[1]);
  }
  return trimmed.toLowerCase().endsWith('.pdf') || trimmed.includes('s3.amazonaws.com');
}

export function resolveValidPdfUrl(dataset: ExamDataset): string | null {
  if (!dataset) return null;
  if (dataset.pdfUrl && isValidNumericPdfUrl(dataset.pdfUrl)) {
    return dataset.pdfUrl;
  }
  let numId = extractNumericProductId(dataset);
  if (!numId && typeof document !== 'undefined') {
    try {
      const pdfAnchor = document.querySelector('a[href*="/api/exams/pdf"]') as HTMLAnchorElement | null;
      if (pdfAnchor && pdfAnchor.href) {
        const m = pdfAnchor.href.match(/productId=(\d{5,8})/i);
        if (m && m[1]) numId = m[1];
      }
    } catch (e) {}
  }
  return numId ? `/api/exams/pdf?productId=${numId}` : null;
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
  let targetZipUrl = dataset.zipUrl;

  // Live DOM re-extraction to refresh expired presigned S3 URLs
  if (typeof document !== 'undefined') {
    try {
      const freshZip = extractPeZipUrl(document.documentElement.innerHTML, true);
      if (freshZip) {
        targetZipUrl = freshZip;
      }
    } catch (e) {}
  }

  if (!targetZipUrl) return false;

  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_AnswerKey.zip`;
  return await downloadAssetUrl(targetZipUrl, filename);
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

    if (dataset.zipUrl) {
      const zipBuf = await fetchArrayBuffer(dataset.zipUrl);
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
      if (dataset.zipUrl) zipOk = await downloadZipAsset(dataset);
      return pdfOk || zipOk;
    }
  }
}

function downloadBlobFromObjectUrl(url: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportBulkOptions {
  feFormat?: FEFormat;
  peFormat?: PEFormat;
  onProgress?: ExportProgressCallback;
  getControlState?: () => { isPaused: boolean; isCanceled: boolean };
  batchSize?: number;
}

export async function exportBulkAsZip(
  savedItems: SavedExamItem[],
  feFormatOrOptions: FEFormat | ExportBulkOptions = 'MD',
  peFormatParam: PEFormat = 'PE_BOTH'
): Promise<void> {
  if (!savedItems || savedItems.length === 0) return;

  let feFormat: FEFormat = 'MD';
  let peFormat: PEFormat = 'PE_BOTH';
  let onProgress: ExportProgressCallback | undefined;
  let getControlState: (() => { isPaused: boolean; isCanceled: boolean }) | undefined;
  let batchSize = EXAMSETS_PER_BATCH;

  if (typeof feFormatOrOptions === 'object' && feFormatOrOptions !== null) {
    feFormat = feFormatOrOptions.feFormat || 'MD';
    peFormat = feFormatOrOptions.peFormat || 'PE_BOTH';
    onProgress = feFormatOrOptions.onProgress;
    getControlState = feFormatOrOptions.getControlState;
    if (feFormatOrOptions.batchSize && feFormatOrOptions.batchSize > 0) {
      batchSize = feFormatOrOptions.batchSize;
    }
  } else {
    feFormat = feFormatOrOptions as FEFormat;
    peFormat = peFormatParam;
  }

  const totalItems = savedItems.length;
  const totalBatches = Math.ceil(totalItems / batchSize);
  let completedItems = 0;
  const logs: string[] = [];

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    logs.push(`[${time}] ${msg}`);
    if (logs.length > 100) logs.shift(); // Keep log buffer clean
  };

  const reportProgress = (
    batchIdx: number,
    status: BatchProgressState['batchStatus'],
    currentExamCode: string,
    note: string
  ) => {
    addLog(note);
    const ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
    onProgress?.({
      totalItems,
      completedItems,
      currentBatchIndex: batchIdx,
      totalBatches,
      batchStatus: status,
      currentExamCode,
      currentLogNote: note,
      isPaused: ctrl.isPaused,
      isCanceled: ctrl.isCanceled,
      isDrawerExpanded: false,
      logs: [...logs]
    });
  };

  addLog(`Starting bulk export of ${totalItems} examsets (${totalBatches} batch parts)...`);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    // 1. Check Cancel / Pause before batch start
    let ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
    if (ctrl.isCanceled) {
      reportProgress(batchIdx, 'done', '', 'Export cancelled by user');
      return;
    }
    while (ctrl.isPaused && !ctrl.isCanceled) {
      reportProgress(batchIdx, 'standby', '', 'Export paused');
      await new Promise((r) => setTimeout(r, 200));
      ctrl = getControlState?.() || { isPaused: false, isCanceled: false };
    }
    if (ctrl.isCanceled) {
      reportProgress(batchIdx, 'done', '', 'Export cancelled by user');
      return;
    }

    const batchStart = batchIdx * batchSize;
    const batchEnd = Math.min((batchIdx + 1) * batchSize, totalItems);
    const batchItems = savedItems.slice(batchStart, batchEnd);

    reportProgress(
      batchIdx,
      'compiling',
      '',
      `Compiling Batch ${batchIdx + 1} of ${totalBatches} (${batchItems.length} items)...`
    );

    const zip = new JSZip();
    const itemsAudit: ManifestItemAudit[] = [];
    let batchHasMissingFeImages = false;

    for (const item of batchItems) {
      // Check Cancel / Pause during item compilation
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
            folder?.file(`${title}_Paper.pdf`, fetchRes.buffer);
            itemAudit.assets.push({ type: 'PDF', status: 'Available' });
          } else {
            addLog(`[${subjCode}] PE PDF asset unavailable (HTTP 404/401) — marked missing in audit manifest`);
            itemAudit.assets.push({ type: 'PDF', status: 'Missing', url: fetchRes.url });
          }
        }

        if ((peFormat === 'PE_ZIP' || peFormat === 'PE_BOTH') && ds.zipUrl) {
          const fetchRes = await fetchArrayBufferWithFastRetry(ds.zipUrl, 3, 80, (st, attempt) => {
            if (st === 'retrying') {
              reportProgress(batchIdx, 'retrying', subjCode, `[${subjCode}] Retrying PE ZIP (attempt ${attempt}/3)...`);
            }
          });

          if (fetchRes.status === 'available' && fetchRes.buffer) {
            folder?.file(`${title}_AnswerKey.zip`, fetchRes.buffer);
            itemAudit.assets.push({ type: 'ZIP', status: 'Available' });
          } else {
            addLog(`[${subjCode}] PE ZIP asset unavailable (HTTP 403/404) — marked missing in audit manifest`);
            itemAudit.assets.push({ type: 'ZIP', status: 'Missing', url: fetchRes.url });
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
                  addLog(`[${subjCode}] Image Q${q.index || qIdx + 1} asset unavailable (HTTP 404/401) — marked missing in manifest`);
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
          folder?.file(`${title}.json`, jsonStr);
        } else if (feFormat === 'PDF') {
          const htmlStr = generatePrintHtml(datasetCopy);
          folder?.file(`${title}.html`, htmlStr);
        } else {
          // Default MD
          const mdStr = await compileMarkdown(datasetCopy, true);
          folder?.file(`${title}.md`, mdStr);
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

    // 3. Include Python recovery TUI and reimport folder if missing FE images exist
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

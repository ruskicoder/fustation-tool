import JSZip from 'jszip';
import { ExamDataset, ExportFormat, FEFormat, PEFormat, SavedExamItem } from '../types';
import { compileMarkdown } from './compiler';
import { renderMathInText } from './math';
import { embedBase64ImagesInDataset, normalizeImageUrl } from './images';

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
  const titleMatch = (ds.title || ds.parsedTitle || '').match(/\d{5,8}$/);
  if (titleMatch && titleMatch[0]) return titleMatch[0];
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
  const numId = extractNumericProductId(dataset);
  const pdfUrl = (dataset.pdfUrl && !dataset.pdfUrl.includes('productId=cmo') && !dataset.pdfUrl.includes('productId=exam_'))
    ? dataset.pdfUrl
    : (numId ? `/api/exams/pdf?productId=${numId}` : null);
  if (!pdfUrl) return false;
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_Paper.pdf`;
  return await downloadAssetUrl(pdfUrl, filename);
}

export async function downloadZipAsset(dataset: ExamDataset): Promise<boolean> {
  if (!dataset || !dataset.zipUrl) return false;
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}_AnswerKey.zip`;
  return await downloadAssetUrl(dataset.zipUrl, filename);
}

export async function exportSinglePe(dataset: ExamDataset, peFormat: PEFormat = 'PE_BOTH'): Promise<boolean> {
  const title = (dataset.title || 'PE_Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const numId = extractNumericProductId(dataset);
  const pdfUrl = (dataset.pdfUrl && !dataset.pdfUrl.includes('productId=cmo') && !dataset.pdfUrl.includes('productId=exam_'))
    ? dataset.pdfUrl
    : (numId ? `/api/exams/pdf?productId=${numId}` : null);

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
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportBulkAsZip(
  savedItems: SavedExamItem[],
  feFormat: FEFormat = 'MD',
  peFormat: PEFormat = 'PE_BOTH'
): Promise<void> {
  if (!savedItems || savedItems.length === 0) return;

  const zip = new JSZip();

  for (const item of savedItems) {
    const ds = item.dataset || (item as any);
    const subjCode = (ds.subjectCode || item.subjectCode || 'UNASSIGNED').toUpperCase();
    const folder = zip.folder(subjCode);
    const title = (ds.title || item.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');

    const isItemPe = isPeDataset(ds as ExamDataset);

    if (isItemPe) {
      // PE asset export inside subject folder
      const numId = extractNumericProductId(ds as ExamDataset);
      const pdfUrl = (ds.pdfUrl && !ds.pdfUrl.includes('productId=cmo') && !ds.pdfUrl.includes('productId=exam_'))
        ? ds.pdfUrl
        : (numId ? `/api/exams/pdf?productId=${numId}` : null);

      if ((peFormat === 'PE_PDF' || peFormat === 'PE_BOTH') && pdfUrl) {
        const pdfBuf = await fetchArrayBuffer(pdfUrl);
        if (pdfBuf) {
          folder?.file(`${title}_Paper.pdf`, pdfBuf);
        }
      }
      if ((peFormat === 'PE_ZIP' || peFormat === 'PE_BOTH') && ds.zipUrl) {
        const zipBuf = await fetchArrayBuffer(ds.zipUrl);
        if (zipBuf) {
          folder?.file(`${title}_AnswerKey.zip`, zipBuf);
        }
      }
    } else {
      // FE exam export inside subject folder
      const embeddedDataset = await embedBase64ImagesInDataset(ds as ExamDataset);
      if (feFormat === 'JSON') {
        const jsonStr = JSON.stringify(embeddedDataset, null, 2);
        folder?.file(`${title}.json`, jsonStr);
      } else if (feFormat === 'PDF') {
        const htmlStr = generatePrintHtml(embeddedDataset);
        folder?.file(`${title}.html`, htmlStr);
      } else {
        // Default MD
        const mdStr = await compileMarkdown(embeddedDataset, true);
        folder?.file(`${title}.md`, mdStr);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const dateStr = getFormattedDateString();
  const filename = `fustation_export_${dateStr}.zip`;
  
  const url = URL.createObjectURL(zipBlob);
  downloadBlobFromObjectUrl(url, filename);
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

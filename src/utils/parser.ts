import { ExamDataset, Question, Option } from '../types';
import { extractExamIdFromPath } from './examId';

export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"');
}

export function sanitizeRscDate(dateStr: string): string {
  if (!dateStr) return '';
  let cleaned = dateStr.trim();

  // Strip Next.js RSC date prefix "$D"
  if (cleaned.startsWith('$D')) {
    cleaned = cleaned.substring(2);
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  return cleaned;
}

export const formatDateString = sanitizeRscDate;

export interface ParsedExamCode {
  subjectCode: string;
  term: string;
  examType: string;
  examCode: string;
  termCode: string;
  typeCode: string;
}

export function parseExamCode(title: string): ParsedExamCode {
  const cleanTitle = (title || '').trim();
  
  // Default values
  let subjectCode = 'EXAM';
  let term = 'SP26';
  let examType = 'FE';
  let examCode = '';

  const parts = cleanTitle.split('_');

  // 1. Extract Subject Code at START (3 Alphas + 3 Numericals + 0-2 Optional Alphas)
  const subjMatch = cleanTitle.match(/^[A-Z]{3}\d{3}[A-Za-z]{0,2}/i);
  if (subjMatch) {
    subjectCode = subjMatch[0].toUpperCase();
  } else if (parts[0]) {
    subjectCode = parts[0].toUpperCase();
  }

  // 2. Extract Term from delimited tokens (e.g. SP26, SU26, FA25)
  for (const part of parts) {
    const upper = part.toUpperCase();
    if (upper === subjectCode) continue;
    const termMatch = upper.match(/^[A-Z]{2}\d{2}$/);
    if (termMatch) {
      term = termMatch[0];
      break;
    }
  }

  // 3. Extract Exam Code at END (6 Numericals)
  const codeMatch = cleanTitle.match(/\d{6}$/);
  if (codeMatch) {
    examCode = codeMatch[0];
  } else if (parts.length > 1) {
    examCode = parts[parts.length - 1];
  }

  // 4. Extract Exam Type (FE, PE, RE, etc.)
  for (const part of parts) {
    const upper = part.toUpperCase();
    if (['FE', 'PE', 'RE', 'PE1', 'B5FE'].includes(upper)) {
      examType = upper;
      break;
    }
  }

  return {
    subjectCode,
    term,
    examType,
    examCode,
    termCode: term,
    typeCode: examType
  };
}

export function sanitizeOptionText(text: string, optId: string): string {
  if (!text) return '';
  let cleaned = decodeHtmlEntities(text.trim());

  // If text starts with "A. " or "A: " or "A ", strip it
  const prefixRegex = new RegExp(`^${optId}[.:\\s-]+`, 'i');
  cleaned = cleaned.replace(prefixRegex, '');

  // If text starts with just "A" followed directly by text without space (e.g. "AMâu thuẫn..."), strip leading optId
  if (cleaned.length > 1 && cleaned.toUpperCase().startsWith(optId.toUpperCase())) {
    const nextChar = cleaned[optId.length];
    if (nextChar && nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase()) {
      cleaned = cleaned.substring(optId.length).trim();
    }
  }

  // Deduplicate repeated string halves if present (e.g. "Sentence. Sentence")
  const halfLen = Math.floor(cleaned.length / 2);
  if (halfLen > 5) {
    const firstHalf = cleaned.substring(0, halfLen).trim();
    const secondHalf = cleaned.substring(halfLen).trim();
    if (firstHalf === secondHalf) {
      cleaned = firstHalf;
    }
  }

  return cleaned;
}

function isEscapedQuote(str: string, i: number): boolean {
  let backslashes = 0;
  for (let j = i - 1; j >= 0 && str[j] === '\\'; j--) backslashes++;
  return backslashes % 2 === 1;
}

export function tryParsePartialJson(str: string): any {
  let count = 0;
  let inString = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !isEscapedQuote(str, i)) {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') count++;
      else if (char === '}') {
        count--;
        if (count === 0) {
          try {
            return JSON.parse(str.substring(0, i + 1));
          } catch (e) {
            break;
          }
        }
      }
    }
  }
  return null;
}

export function getExamIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return extractExamIdFromPath(window.location.pathname);
}

function resolveRscRefs(obj: any, refs: Record<string, string>) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && obj[i].startsWith('$') && refs[obj[i]]) {
        obj[i] = refs[obj[i]];
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        resolveRscRefs(obj[i], refs);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('$') && refs[obj[key]]) {
        obj[key] = refs[obj[key]];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        resolveRscRefs(obj[key], refs);
      }
    }
  }
}

export function unescapeNextFChunk(text: string, targetId?: string): any {
  try {
    const matches = Array.from(text.matchAll(/self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g));
    let fallbackParsed: any = null;

    // Pass 1: Build RSC dictionary for string references
    const rscRefs: Record<string, string> = {};
    for (const match of matches) {
      try {
        const unescaped = JSON.parse(`"${match[1]}"`);
        const refMatches = Array.from(unescaped.matchAll(/([a-zA-Z0-9]+):T(\d+),/g)) as RegExpMatchArray[];
        for (const rMatch of refMatches) {
          const id = rMatch[1];
          const len = parseInt(rMatch[2], 10);
          const startIdx = (rMatch.index || 0) + rMatch[0].length;
          rscRefs[`$${id}`] = unescaped.substring(startIdx, startIdx + len);
        }
      } catch (e) {}
    }

    // Pass 2: Try matching targetId specifically if provided
    for (const match of matches) {
      const escaped = match[1];
      if (escaped.includes('initialData') || escaped.includes('questions')) {
        const unescaped = escaped
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        const initDataIdx = unescaped.indexOf('"initialData":');
        if (initDataIdx !== -1) {
          const objStart = unescaped.lastIndexOf('{', initDataIdx);
          if (objStart !== -1) {
            const parsed = tryParsePartialJson(unescaped.substring(objStart));
            if (parsed && parsed.initialData) {
              resolveRscRefs(parsed, rscRefs);
              if (targetId && (escaped.includes(targetId) || (parsed.initialData.product && parsed.initialData.product.id === targetId))) {
                return parsed;
              }
              if (!fallbackParsed) fallbackParsed = parsed;
            }
          }
        }

        const prodIdx = unescaped.indexOf('{"productId":');
        if (prodIdx !== -1) {
          const parsed = tryParsePartialJson(unescaped.substring(prodIdx));
          if (parsed && parsed.initialData) {
            resolveRscRefs(parsed, rscRefs);
            if (targetId && (escaped.includes(targetId) || (parsed.initialData.product && parsed.initialData.product.id === targetId))) {
              return parsed;
            }
            if (!fallbackParsed) fallbackParsed = parsed;
          }
        }
      }
    }

    if (fallbackParsed && !targetId) {
      return fallbackParsed;
    }

    // Direct search in raw HTML text
    const initDataIdx = text.indexOf('"initialData":');
    if (initDataIdx !== -1) {
      const objStart = text.lastIndexOf('{', initDataIdx);
      if (objStart !== -1) {
        const parsed = tryParsePartialJson(text.substring(objStart));
        if (parsed && parsed.initialData) {
          resolveRscRefs(parsed, rscRefs);
          if (targetId && parsed.initialData.product && parsed.initialData.product.id !== targetId) {
            return null; // Stale data, ID mismatch
          }
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[fustation-tool] Chunk unescape error:', e);
  }
  return null;
}

export function extractSessionTimeFromText(text?: string, prod?: any): string {
  // Pass 1: RSC product object properties
  if (prod) {
    if (prod.examSessionTime && /^\d{1,2}:\d{2}$/.test(prod.examSessionTime)) return prod.examSessionTime;
    if (prod.sessionTime && /^\d{1,2}:\d{2}$/.test(prod.sessionTime)) return prod.sessionTime;
    if (prod.startTime && /^\d{1,2}:\d{2}$/.test(prod.startTime)) return prod.startTime;
  }

  // Pass 2: Regex extraction from DOM text / HTML
  const sourceText = text || (typeof document !== 'undefined' ? document.body?.textContent || '' : '');
  if (sourceText) {
    // Match "Ca thi: 14:40" or "Ca thi 14:40"
    const caThiMatch = sourceText.match(/Ca\s*thi\s*[:\s]*(\d{1,2}:\d{2})/i);
    if (caThiMatch && caThiMatch[1]) {
      return caThiMatch[1];
    }

    // Match "14:40 | 25/4/2026" or "14:40 - 25/04/2026"
    const sessionMatch = sourceText.match(/\b(\d{1,2}:\d{2})\s*[\/\u2044|:\-]\s*\d{1,2}[\/\u2044\-]\d{1,2}[\/\u2044\-]\d{4}\b/);
    if (sessionMatch && sessionMatch[1]) {
      return sessionMatch[1];
    }
  }

  return 'N/A'; // Clear, explicit fallback indicating missing session time
}

export function sanitizeAssetUrl(url: string | null): string | null {
  if (!url) return null;
  return url
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/\\/g, '')
    .trim();
}

export function extractPeZipUrl(fullHtml: string, isLiveDom: boolean = false): string | null {
  if (!fullHtml) return null;

  // Pre-sanitize raw HTML and RSC string escapes
  const cleanHtml = fullHtml
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '/');

  // Stage 1: Live DOM query ONLY if explicitly in active tab live DOM context
  if (isLiveDom && typeof document !== 'undefined') {
    try {
      const zipAnchor = (document.querySelector('a[href*=".zip" i]') ||
                         document.querySelector('a[href*="material" i]') ||
                         document.querySelector('a[href*="answer-key" i]') ||
                         Array.from(document.querySelectorAll('a')).find((a) =>
                           /Tải\s*Bộ\s*Đáp\s*án|Đáp\s*án|ZIP|material|answer-key|lucide-archive/i.test(a.textContent || a.innerHTML || '')
                         )
                        ) as HTMLAnchorElement | null;
      if (zipAnchor && zipAnchor.href && !zipAnchor.href.includes('/api/exams/pdf')) {
        return sanitizeAssetUrl(zipAnchor.href);
      }
    } catch (e) {}
  }

  // Stage 2: HTML Anchor tag string matching (handles single/double quotes & lucide-archive icons)
  const dapanAnchorMatch = cleanHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?(?:Tải Bộ Đáp án|Bộ Đáp án|Đáp án|\.zip|lucide-archive|material|answer-key)[\s\S]*?<\/a>/i);
  if (dapanAnchorMatch && dapanAnchorMatch[1] && !dapanAnchorMatch[1].includes('/api/exams/pdf')) {
    return sanitizeAssetUrl(dapanAnchorMatch[1]);
  }

  // Stage 3: Flexible Href attribute matching (_material.zip, material.zip, answer-key.zip, .zip)
  const zipHrefMatch = cleanHtml.match(/href=["']([^"']*(?:\.zip|material|answer-key|_material)[^"']*)["']/i);
  if (zipHrefMatch && !zipHrefMatch[1].includes('/api/exams/pdf')) {
    return sanitizeAssetUrl(zipHrefMatch[1]);
  }

  // Stage 4: Raw S3 / HTTP presigned ZIP URL matching (supports case-insensitive .zip and S3 query strings)
  const rawZipMatch = cleanHtml.match(/https?:\/\/[^\s"'\>]+\.zip(?:\?[^\s"'\>]*)?/i) ||
                      cleanHtml.match(/https?:\/\/[^\s"'\>]*(?:material|answer-key)[^\s"'\>]*/i);
  if (rawZipMatch && !rawZipMatch[0].includes('/api/exams/pdf')) {
    return sanitizeAssetUrl(rawZipMatch[0]);
  }

  return null;
}

export function formatExamDataset(initialData: any, rawPayloadText?: string): ExamDataset {
  const prod = initialData.product || {};
  const subj = prod.subject || {};
  const title = prod.title || 'Exam Set';
  const parsedCode = parseExamCode(title);

  const campus = prod.description || prod.campus || 'XAVALO';
  const term = parsedCode.term || prod.term || 'SP26';

  const rawProdType = (prod.examType || prod.category || '').toString().toUpperCase();
  const isProdPe = rawProdType === 'PE' || rawProdType === 'PRACTICAL_EXAM' || rawProdType.includes('PE');
  const examType = isProdPe ? 'PE' : (parsedCode.examType !== 'FE' ? parsedCode.examType : (prod.examType || 'FE'));

  const fullHtml = rawPayloadText || (typeof document !== 'undefined' ? document.documentElement.innerHTML : '');
  const isLiveDom = !rawPayloadText && typeof document !== 'undefined';

  const examSessionTime = extractSessionTimeFromText(fullHtml, prod);
  const examSessionDate = sanitizeRscDate(prod.createdAt || prod.examSessionDate || '$D2026-04-29T00:00:00.000Z');

  const questionsList = initialData.questions || [];

  // Deterministic ID resolution
  const deterministicId = prod.id || initialData.productId || (parsedCode.subjectCode && parsedCode.examCode ? `${parsedCode.subjectCode}_${parsedCode.examCode}` : getExamIdFromUrl()) || `exam_${parsedCode.subjectCode}_${Date.now()}`;

  // PE Asset links (PDF & ZIP) extraction
  let pdfUrl: string | null = initialData.examUrl || prod.pdfUrl || prod.pdf || initialData.pdfUrl || null;
  if (!pdfUrl) {
    const rawIdCandidate = prod.id || initialData.productId || parsedCode.examCode || '';
    const numMatch = String(rawIdCandidate).match(/^\d{5,8}$/) || String(rawIdCandidate).match(/(\d{5,8})$/);
    if (numMatch && numMatch[1]) {
      pdfUrl = `/api/exams/pdf?productId=${numMatch[1]}`;
    }
  }

  let zipUrl: string | null = prod.materialUrl || prod.fileUrl || prod.zipUrl || prod.zip || prod.answerKeyUrl || prod.answerKey || prod.assetUrl || prod.downloadUrl || initialData.zipUrl || initialData.materialUrl || null;
  if (!zipUrl && fullHtml) {
    zipUrl = extractPeZipUrl(fullHtml, isLiveDom);
  }

  // Category classification (FE vs PE)
  const isPeType = isProdPe || ['PE', 'PE1', 'PE2', 'B5PE'].includes(examType.toUpperCase()) || parsedCode.examType.toUpperCase().includes('PE');
  const examCategory: 'FE' | 'PE' = (isPeType || (questionsList.length === 0 && (pdfUrl || zipUrl))) ? 'PE' : 'FE';

  return {
    id: deterministicId,
    title: title,
    subjectCode: prod.subjectCode || subj.code || parsedCode.subjectCode || 'EXAM',
    subjectName: decodeHtmlEntities(subj.name || 'Subject'),
    author: campus,
    campus: campus,
    term: term,
    termCode: term,
    examType: examType,
    examCategory: examCategory,
    pdfUrl: sanitizeAssetUrl(pdfUrl),
    zipUrl: sanitizeAssetUrl(zipUrl),
    examSessionTime: examSessionTime,
    examSessionDate: examSessionDate,
    parsedTitle: title,
    totalQuestions: initialData.totalQuestions || questionsList.length,
    isPartial: false,
    questions: questionsList.map((q: any, idx: number) => {
      const qIndex = q.index !== undefined ? q.index : idx + 1;
      const opts: Option[] = (q.options || []).map((opt: any) => ({
        id: opt.id || 'A',
        text: sanitizeOptionText(decodeHtmlEntities(opt.text || ''), opt.id)
      }));

      let correctAns: string[] = [];
      if (Array.isArray(q.correctAnswers)) {
        correctAns = q.correctAnswers;
      } else if (typeof q.correctAnswer === 'string') {
        correctAns = [q.correctAnswer];
      }

      return {
        id: q.id || `q_${qIndex}`,
        index: qIndex,
        text: decodeHtmlEntities(q.text || q.questionText || ''),
        options: opts,
        correctAnswers: correctAns,
        explanation: q.explanation ? decodeHtmlEntities(q.explanation) : undefined,
        imageUrl: q.imageUrl || q.image || undefined,
        imageBase64: q.imageBase64 || undefined
      };
    })
  };
}

export function extractPeFromDOM(fullHtml?: string): ExamDataset | null {
  const html = fullHtml || (typeof document !== 'undefined' ? document.documentElement.innerHTML : '');
  if (!html) return null;

  const pdfMatch = html.match(/\/api\/exams\/pdf\?productId=([a-zA-Z0-9]+)/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const isPePage = /PE|Thi\s*PE|Tả\i\s*Đề\s*thi/i.test(html) || !!pdfMatch;

  if (!isPePage && !pdfMatch && !h1Match) return null;

  const title = h1Match ? h1Match[1].trim() : 'PE Exam';
  const parsedCode = parseExamCode(title);

  const productId = pdfMatch ? pdfMatch[1] : (parsedCode.subjectCode && parsedCode.examCode ? `${parsedCode.subjectCode}_${parsedCode.examCode}` : getExamIdFromUrl()) || `pe_${Date.now()}`;
  const pdfUrl = pdfMatch ? `/api/exams/pdf?productId=${productId}` : null;

  const isLiveDom = !fullHtml && typeof document !== 'undefined';
  const zipUrl = extractPeZipUrl(html, isLiveDom);

  const subjBadgeMatch = html.match(/<span[^>]*data-slot="badge"[^>]*>([^<]+)<\/span>/i);
  const subjectName = subjBadgeMatch ? subjBadgeMatch[1].trim() : (parsedCode.subjectCode || 'PE Subject');

  return {
    id: productId,
    title,
    subjectCode: parsedCode.subjectCode || 'PE',
    subjectName,
    author: 'XAVALO',
    campus: 'XAVALO',
    term: parsedCode.term || 'SP26',
    termCode: parsedCode.term || 'SP26',
    examType: parsedCode.examType || 'PE',
    examCategory: 'PE',
    pdfUrl,
    zipUrl,
    examSessionTime: 'N/A',
    examSessionDate: '29/04/2026',
    parsedTitle: title,
    totalQuestions: 0,
    questions: []
  };
}

export function extractExamFromScripts(targetProductId?: string): ExamDataset | null {
  if (typeof document === 'undefined') return null;

  const activeTargetId = targetProductId || getExamIdFromUrl() || undefined;

  // 1. Check raw HTML first
  const fullHtml = document.documentElement.innerHTML;
  if (fullHtml.includes('initialData') || fullHtml.includes('questions')) {
    const parsed = unescapeNextFChunk(fullHtml, activeTargetId);
    if (parsed && parsed.initialData) {
      return formatExamDataset(parsed.initialData, fullHtml);
    }
  }

  // 2. Fallback to document.scripts
  const scripts = Array.from(document.scripts);
  for (const script of scripts) {
    const content = script.textContent || script.innerText || '';
    if (content.includes('initialData') || content.includes('questions')) {
      const parsed = unescapeNextFChunk(content, activeTargetId);
      if (parsed && parsed.initialData) {
        return formatExamDataset(parsed.initialData, fullHtml);
      }
    }
  }

  // 3. Fallback: DOM Extraction for PE Exams
  return extractPeFromDOM(fullHtml);
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function readSidebarCounter(): { cur: number; total: number } | null {
  const h3 = Array.from(document.querySelectorAll('h3')).find((el) =>
    /Câu\s*h[oỏ]i\s+\d+\s*[\/\u2044]\s*\d+/i.test((el.textContent || '').trim())
  );
  if (!h3) return null;
  const m = (h3.textContent || '').match(/(\d+)\s*[\/\u2044]\s*(\d+)/);
  return m ? { cur: parseInt(m[1], 10), total: parseInt(m[2], 10) } : null;
}

async function pollSidebarCounter(
  expectedQ: number,
  maxWaitMs = 1500
): Promise<{ cur: number; total: number } | null> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const counter = readSidebarCounter();
    if (counter && counter.cur === expectedQ) return counter;
    await delay(100);
  }
  return null;
}

function findResetButton(): HTMLButtonElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((btn) => {
      const txt = (btn.textContent || '').trim();
      return (
        txt === 'Làm lại đề' ||
        (txt.includes('Làm lại') && !txt.includes('từ đầu') && !!btn.querySelector('svg.lucide-rotate-ccw'))
      );
    }) || null
  );
}

/**
 * @deprecated Not called from the primary fetch pipeline (ISSUE-43 resolution).
 * Kept for future use as an explicit "Deep Scan" fallback only.
 * DOM selectors are known to be unreliable against fustation.net's RSC-hydrated UI:
 * Radix UI renders `<div role="radio">` wrappers, not `<button>` elements, so all
 * existing option/answer selectors return 0 matches.
 * Do NOT call this from runFetch or any auto-fetch path.
 */
export async function crawlExamFromDOM(
  onProgress?: (current: number, total: number) => void
): Promise<ExamDataset | null> {
  if (typeof document === 'undefined') return null;

  // Find Exam Metadata
  const titleEl = document.querySelector('h1');
  const title = titleEl ? titleEl.textContent?.trim() || 'Exam' : 'Exam';
  const parsedCode = parseExamCode(title);
  const subjectCode = parsedCode.subjectCode;
  const subjectBadge = document.querySelector('span[data-slot="badge"]:nth-child(2)');
  const subjectName = subjectBadge ? subjectBadge.textContent?.trim() || subjectCode : subjectCode;
  const authorEl = document.querySelector('p.text-muted-foreground');
  const author = authorEl ? authorEl.textContent?.trim() || 'XAVALO' : 'XAVALO';

  // 1. Strict Total Question Detection
  let totalQuestions = 0;

  // Pass 1: Authoritative sidebar h3 ("Câu hỏi X / Y")
  const initialCounter = readSidebarCounter();
  if (initialCounter) {
    totalQuestions = initialCounter.total;
  }

  // Pass 2: Fallback inline per-question span counter ("Câu X / Y")
  if (totalQuestions === 0) {
    const spanEls = Array.from(document.querySelectorAll('span.font-mono'));
    for (const el of spanEls) {
      const txt = (el.textContent || '').trim();
      const m = txt.match(/Câu\s+\d+\s*[\/\u2044]\s*(\d+)/i);
      if (m) {
        totalQuestions = parseInt(m[1], 10);
        break;
      }
    }
  }

  // 2. Rewind Phase (Reset to Question 1 before crawling)
  const resetBtn = findResetButton();
  if (resetBtn) {
    resetBtn.click();
    const afterReset = await pollSidebarCounter(1, 1500);
    if (afterReset) totalQuestions = afterReset.total;
  } else {
    // Fallback: Loop 'Trước' until Q1 reached
    let safetyLimit = (totalQuestions || 60) + 5;
    while (safetyLimit-- > 0) {
      const counter = readSidebarCounter();
      if (!counter || counter.cur <= 1) break;
      const prevBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
        (b) => (b.textContent || '').trim().includes('Trước')
      );
      if (!prevBtn || prevBtn.disabled) break;
      prevBtn.click();
      await delay(100);
    }
    const finalCounter = readSidebarCounter();
    if (finalCounter) totalQuestions = finalCounter.total;
  }

  if (totalQuestions === 0) totalQuestions = 60; // Final fallback safety net

  const questions: Question[] = [];

  for (let qIdx = 1; qIdx <= totalQuestions; qIdx++) {
    if (onProgress) onProgress(qIdx, totalQuestions);

    const qContainer = document.querySelector('div.w-3\\/4') || document.querySelector('main') || document.querySelector('[data-slot="card"]') || document;
    if (!qContainer) break;

    const qTitleEl = qContainer.querySelector('h2');
    const qText = qTitleEl ? decodeHtmlEntities(qTitleEl.textContent?.trim() || '') : '';
    const imgEl = qContainer.querySelector<HTMLImageElement>('img');
    const imageUrl = imgEl ? imgEl.src : null;

    const optBtns = Array.from(qContainer.querySelectorAll<HTMLButtonElement>('div.space-y-2\\.5 button, button[role="radio"], button[data-slot="button"]'));
    
    // Check if answer text "Đáp án đúng: \nC" or "Đáp án đúng: \nA,B,C" is already present
    let containerText = qContainer.textContent || '';
    let hasAnswerRevealed = /Đáp án\s*đúng\s*:\s*[A-E]/i.test(containerText) || optBtns.some(btn => 
      btn.className.includes('emerald') || 
      btn.className.includes('green') || 
      btn.className.includes('bg-primary') ||
      btn.querySelector('svg.lucide-check')
    );

    if (!hasAnswerRevealed && optBtns.length > 0) {
      optBtns[0].click();
      await delay(100);
      containerText = qContainer.textContent || '';
    }

    const options: Option[] = [];
    const correctAnswers: string[] = [];

    // Parse options list
    optBtns.forEach((btn, btnIdx) => {
      const badgeEl = btn.querySelector('div');
      let optId = badgeEl ? badgeEl.textContent?.trim() || '' : '';
      if (!optId) {
        optId = String.fromCharCode(65 + btnIdx); // 'A', 'B', 'C', 'D'
      }
      optId = optId.charAt(0).toUpperCase();

      const textEl = btn.querySelector('span.leading-snug') || btn.querySelector('span');
      let rawText = textEl ? textEl.textContent?.trim() || '' : btn.textContent?.trim() || '';

      const cleanText = sanitizeOptionText(rawText, optId);
      if (cleanText) {
        options.push({ id: optId, text: cleanText });
      }
    });

    // 1. Extract correct answers from text block "Đáp án đúng: \nC" or "Đáp án đúng: \nA,B,C"
    const ansMatch = containerText.match(/Đáp án\s*đúng\s*:\s*([A-E,\s\n]+)/i);
    if (ansMatch && ansMatch[1]) {
      const rawAns = ansMatch[1];
      const parsedKeys = rawAns.split(/[\s,\n]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-E]$/.test(s));
      parsedKeys.forEach(k => {
        if (!correctAnswers.includes(k)) correctAnswers.push(k);
      });
    }

    // 2. Fallback to option button CSS class inspection
    if (correctAnswers.length === 0) {
      optBtns.forEach((btn, btnIdx) => {
        const badgeEl = btn.querySelector('div');
        let optId = badgeEl ? badgeEl.textContent?.trim() || '' : '';
        if (!optId) optId = String.fromCharCode(65 + btnIdx);
        optId = optId.charAt(0).toUpperCase();

        const btnHtml = btn.outerHTML || '';
        const btnClass = btn.className || '';
        if (
          btnClass.includes('emerald') ||
          btnClass.includes('green') ||
          btnClass.includes('bg-primary') ||
          btnHtml.includes('lucide-check') ||
          btn.getAttribute('data-correct') === 'true'
        ) {
          if (!correctAnswers.includes(optId)) correctAnswers.push(optId);
        }
      });
    }

    questions.push({
      index: qIdx,
      id: `q_dom_${qIdx}`,
      text: qText,
      imageUrl,
      correctAnswers: correctAnswers,
      options
    });

    // Click Next ("Sau") button to advance
    if (qIdx < totalQuestions) {
      const nextBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b => {
        const txt = (b.textContent || '').trim();
        const aria = (b.getAttribute('aria-label') || '').trim();
        return (
          txt.includes('Sau') ||
          txt.includes('Tiếp') ||
          txt.includes('Next') ||
          aria.toLowerCase().includes('next') ||
          aria.toLowerCase().includes('sau') ||
          !!b.querySelector('svg.lucide-chevron-right') ||
          !!b.querySelector('svg.lucide-arrow-right')
        );
      });

      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
        const advanced = await pollSidebarCounter(qIdx + 1, 1500);
        if (!advanced) break;
      } else {
        break;
      }
    }
  }

  const isPartial = questions.length < totalQuestions;
  const successFetchCount = questions.length;
  const failedFetchCount = isPartial ? totalQuestions - questions.length : 0;

  const deterministicId = (parsedCode.subjectCode && parsedCode.examCode ? `${parsedCode.subjectCode}_${parsedCode.examCode}` : getExamIdFromUrl()) || `exam_${parsedCode.subjectCode}_${Date.now()}`;
  const term = parsedCode.term || 'SP26';
  const examType = parsedCode.examType || 'FE';

  const bodyText = typeof document !== 'undefined' ? document.body?.textContent || '' : '';
  const examSessionTime = extractSessionTimeFromText(bodyText);

  return {
    id: deterministicId,
    title,
    subjectCode,
    subjectName,
    author,
    campus: author,
    term,
    termCode: term,
    examType,
    examSessionTime,
    examSessionDate: '29/04/2026',
    parsedTitle: title,
    totalQuestions: isPartial ? totalQuestions : questions.length,
    isPartial,
    successFetchCount,
    failedFetchCount,
    questions
  };
}

export function manualRefetch(): ExamDataset | null {
  return extractExamFromScripts();
}

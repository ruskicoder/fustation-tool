import { ExamDataset, Question, Option } from '../types';

export function sanitizeOptionText(text: string, optId: string): string {
  if (!text) return '';
  let cleaned = text.trim();

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

export function tryParsePartialJson(str: string): any {
  let count = 0;
  let inString = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && str[i - 1] !== '\\') {
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

export function unescapeNextFChunk(text: string): any {
  try {
    const matches = text.matchAll(/self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g);
    for (const match of matches) {
      const escaped = match[1];
      if (escaped.includes('initialData')) {
        const unescaped = escaped
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n');
        
        const dataIdx = unescaped.indexOf('{"productId":');
        if (dataIdx !== -1) {
          const jsonCandidate = unescaped.substring(dataIdx);
          const parsed = tryParsePartialJson(jsonCandidate);
          if (parsed && parsed.initialData) {
            return parsed;
          }
        }
      }
    }

    // Direct search for initialData string in raw HTML
    const dataIdx = text.indexOf('{"productId":');
    if (dataIdx !== -1) {
      const jsonCandidate = text.substring(dataIdx);
      const parsed = tryParsePartialJson(jsonCandidate);
      if (parsed && parsed.initialData) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[fustation-tool] Chunk unescape error:', e);
  }
  return null;
}

export function formatExamDataset(initialData: any): ExamDataset {
  const prod = initialData.product || {};
  const subj = prod.subject || {};
  
  return {
    id: prod.id || 'unknown',
    title: prod.title || 'Exam Set',
    subjectCode: prod.subjectCode || subj.code || 'EXAM',
    subjectName: subj.name || 'Subject',
    author: prod.description || (prod.seller && prod.seller.name) || 'XAVALO',
    totalQuestions: (initialData.questions || []).length,
    questions: (initialData.questions || []).map((q: any, idx: number): Question => {
      const validOptions = (q.options || []).map((opt: any): Option => {
        const optId = (opt.id || '').trim().toUpperCase();
        const rawText = (opt.text || '').trim();
        return {
          id: optId,
          text: sanitizeOptionText(rawText, optId)
        };
      });

      const validAnswers = (q.correctAnswers || []).map((ans: string) => {
        const str = (ans || '').trim().toUpperCase();
        return str.length === 1 ? str : str.charAt(0);
      });

      return {
        index: idx + 1,
        id: q.id || `q_${idx}`,
        text: (q.text || '').trim(),
        imageUrl: q.imageUrl || null,
        correctAnswers: validAnswers,
        options: validOptions
      };
    })
  };
}

export function extractExamFromScripts(): ExamDataset | null {
  if (typeof document === 'undefined') return null;

  // 1. Check raw HTML first
  const fullHtml = document.documentElement.innerHTML;
  if (fullHtml.includes('initialData') && fullHtml.includes('"questions":[')) {
    const parsed = unescapeNextFChunk(fullHtml);
    if (parsed && parsed.initialData) {
      return formatExamDataset(parsed.initialData);
    }
  }

  // 2. Fallback to document.scripts
  const scripts = Array.from(document.scripts);
  for (const script of scripts) {
    const content = script.textContent || script.innerText || '';
    if (content.includes('initialData') && content.includes('"questions":[')) {
      const parsed = unescapeNextFChunk(content);
      if (parsed && parsed.initialData) {
        return formatExamDataset(parsed.initialData);
      }
    }
  }
  return null;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function crawlExamFromDOM(
  onProgress?: (current: number, total: number) => void
): Promise<ExamDataset | null> {
  if (typeof document === 'undefined') return null;

  // Find Exam Metadata
  const titleEl = document.querySelector('h1');
  const title = titleEl ? titleEl.textContent?.trim() || 'Exam' : 'Exam';
  const subjectCode = title.split('_')[0] || 'EXAM';
  const subjectBadge = document.querySelector('span[data-slot="badge"]:nth-child(2)');
  const subjectName = subjectBadge ? subjectBadge.textContent?.trim() || subjectCode : subjectCode;
  const authorEl = document.querySelector('p.text-muted-foreground');
  const author = authorEl ? authorEl.textContent?.trim() || 'XAVALO' : 'XAVALO';

  // Find total questions count from sidebar (e.g. "Câu hỏi 1 / 60")
  let totalQuestions = 60;
  const counterEls = Array.from(document.querySelectorAll('p'));
  for (const p of counterEls) {
    const txt = p.textContent || '';
    const match = txt.match(/Câu hỏi\s+\d+\s*\/\s*(\d+)/i);
    if (match && match[1]) {
      totalQuestions = parseInt(match[1], 10);
      break;
    }
  }

  // Ensure Study Mode toggle is enabled
  const studyToggle = document.querySelector<HTMLButtonElement>('#study-mode-toggle');
  if (studyToggle && studyToggle.getAttribute('data-state') === 'unchecked') {
    studyToggle.click();
    await delay(100);
  }

  const questions: Question[] = [];

  for (let qIdx = 1; qIdx <= totalQuestions; qIdx++) {
    if (onProgress) onProgress(qIdx, totalQuestions);

    const qContainer = document.querySelector('div.w-3\\/4');
    if (!qContainer) break;

    const qTitleEl = qContainer.querySelector('h2');
    const qText = qTitleEl ? qTitleEl.textContent?.trim() || '' : '';
    const imgEl = qContainer.querySelector<HTMLImageElement>('img');
    const imageUrl = imgEl ? imgEl.src : null;

    const optBtns = Array.from(qContainer.querySelectorAll<HTMLButtonElement>('div.space-y-2\\.5 button'));
    
    // If correct answer styling is not revealed, click option A
    let hasAnswerRevealed = optBtns.some(btn => 
      btn.className.includes('emerald') || 
      btn.className.includes('green') || 
      btn.className.includes('bg-primary') ||
      btn.querySelector('svg.lucide-check')
    );

    if (!hasAnswerRevealed && optBtns.length > 0) {
      optBtns[0].click();
      await delay(80);
    }

    const options: Option[] = [];
    const correctAnswers: string[] = [];

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

      // Detect if this option is correct
      const btnHtml = btn.outerHTML || '';
      const btnClass = btn.className || '';
      if (
        btnClass.includes('emerald') ||
        btnClass.includes('green') ||
        btnClass.includes('bg-primary') ||
        btnHtml.includes('lucide-check') ||
        btn.getAttribute('data-correct') === 'true'
      ) {
        correctAnswers.push(optId);
      }
    });

    questions.push({
      index: qIdx,
      id: `q_dom_${qIdx}`,
      text: qText,
      imageUrl,
      correctAnswers: correctAnswers.length > 0 ? correctAnswers : ['A'],
      options
    });

    // Click Next ("Sau") button to advance
    if (qIdx < totalQuestions) {
      const nextBtn = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(b => 
        (b.textContent || '').includes('Sau') || b.querySelector('svg.lucide-chevron-right')
      );
      if (nextBtn && !nextBtn.disabled) {
        nextBtn.click();
        await delay(120);
      } else {
        break;
      }
    }
  }

  return {
    id: 'exam_' + Date.now(),
    title,
    subjectCode,
    subjectName,
    author,
    totalQuestions: questions.length,
    questions
  };
}

export function manualRefetch(): ExamDataset | null {
  return extractExamFromScripts();
}

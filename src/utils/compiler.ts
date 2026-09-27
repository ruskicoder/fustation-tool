import { ExamDataset } from '../types';
import { sanitizeMathLatex, MATH_SEGMENT_RE } from './math';
import { normalizeImageUrl, fetchImageAsBase64 } from './images';

// Markdown hard line break: keeps option and multi-line text lines apart when rendered.
const HARD_BREAK = '  \n';

/** Code-like question bodies (Java, C, SQL snippets) are fenced so indentation and `<>` survive. */
function looksLikeCode(text: string): boolean {
  return /[;{}]\s*$/m.test(text) || /^( {2,}|\t)\S/m.test(text);
}

/**
 * Escapes Markdown-sensitive characters outside math spans and restores literal `$`.
 * Input must already be passed through `sanitizeMathLatex`.
 */
function toMarkdownText(sanitized: string): string {
  return sanitized
    .split(MATH_SEGMENT_RE)
    .map((part, idx) => (idx % 2 === 1 ? part : part.replace(/</g, '\\<').replace(/&#36;/g, '\uE000')))
    .join('')
    .replace(/\uE000/g, '\\$');
}

/** Paragraphs separated by blank lines; single newlines inside a paragraph become hard breaks. */
function toMarkdownParagraphs(sanitized: string): string {
  return sanitized
    .split(/\n\s*\n/)
    .map((para) => toMarkdownText(para.trim()).split('\n').join(HARD_BREAK))
    .join('\n\n');
}

export async function compileMarkdown(dataset: ExamDataset, embedImages: boolean = true): Promise<string> {
  if (!dataset) return '';

  const subject = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const campus = dataset.campus || dataset.author || 'N/A';
  const termStr = dataset.term || dataset.termCode || 'N/A';
  const examType = dataset.examType || 'FE';
  const session = `${dataset.examSessionTime || 'N/A'} | ${dataset.examSessionDate || 'N/A'}`;

  const lines: string[] = [
    `# [info]`,
    `- Subject: ${subject}`,
    `- Title: ${dataset.title}`,
    `- Campus: ${campus}`,
    `- Term & Type: ${termStr} - ${examType}`,
    `- Session: ${session}`,
    `- Total Questions: ${dataset.totalQuestions}`,
    ``,
    `---`,
    ``
  ];

  const questions = dataset.questions || [];

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const qNum = idx + 1;
    const rawText = (q.text || '').trim();
    const firstBreak = rawText.indexOf('\n');
    const firstLine = firstBreak === -1 ? rawText : rawText.slice(0, firstBreak);
    const rawBody = firstBreak === -1 ? '' : rawText.slice(firstBreak + 1).replace(/^\s*\n/, '').trimEnd();
    const qTitle = toMarkdownText(sanitizeMathLatex(firstLine).trim()) || '[ Question Illustration ]';

    lines.push(`### Question ${qNum}: ${qTitle}`);
    lines.push(``);

    if (rawBody) {
      if (looksLikeCode(rawBody)) {
        lines.push('```', rawBody, '```');
      } else {
        lines.push(toMarkdownParagraphs(sanitizeMathLatex(rawBody)));
      }
      lines.push(``);
    }

    if (q.imageUrl || q.imageBase64) {
      let imgSrc = q.imageBase64;
      if (!imgSrc && embedImages && q.imageUrl) {
        imgSrc = await fetchImageAsBase64(q.imageUrl);
      }
      if (!imgSrc && q.imageUrl) {
        imgSrc = normalizeImageUrl(q.imageUrl);
      }

      if (imgSrc) {
        lines.push(`![Question ${qNum} Image](${imgSrc})`);
        lines.push(``);
      }
    }

    const optionLines = (q.options || []).map((opt) => {
      const optText = toMarkdownText(sanitizeMathLatex(opt.text || '').trim());
      return `${opt.id}. ${optText.split('\n').join(`${HARD_BREAK}   `)}`;
    });
    if (optionLines.length > 0) {
      lines.push(optionLines.join(HARD_BREAK));
    }

    lines.push(``);
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    lines.push(`Answer: ${answers}`);
    lines.push(``);
  }

  return lines.join('\n');
}

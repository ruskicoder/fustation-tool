import katex from 'katex';
import { highlightText } from './highlight';

/**
 * Clean RSC JSON escape artifacts from LaTeX strings:
 * - `\u0026` / `&amp;` -> `&` (matrix column separators)
 * - `\\\\` -> `\` (double backslashes)
 */
export function sanitizeMathLatex(text: string): string {
  if (!text) return '';
  // Mask escaped currency \$ (written as \\$ or \$) with private Unicode marker \uE000 BEFORE math splitting
  let processed = text.replace(/\\+\$/g, '\uE000');

  return processed
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\\\\\\/g, '\\')
    .replace(/\\\\/g, '\\')
    .replace(/½/g, '\\frac{1}{2}')
    .replace(/¼/g, '\\frac{1}{4}')
    .replace(/¾/g, '\\frac{3}{4}')
    .replace(/€/g, '\\text{EUR}')
    .replace(/₫/g, '\\text{VND}');
}

/**
 * Renders LaTeX formula string via KaTeX while suppressing internal missing character metric warnings.
 */
function renderKatexSafe(formula: string, displayMode: boolean): string {
  const origWarn = console.warn;
  try {
    console.warn = (...args: any[]) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('No character metrics')) {
        return;
      }
      origWarn(...args);
    };
    return katex.renderToString(formula, { displayMode, throwOnError: false, strict: 'ignore' });
  } catch {
    return '';
  } finally {
    console.warn = origWarn;
  }
}

/**
 * Checks if a string contains any LaTeX math syntax.
 */
export function hasMathLatex(text: string): boolean {
  if (!text) return false;
  const clean = sanitizeMathLatex(text);
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\(|\\\[|\\frac|\\sqrt|\\begin\{/i.test(clean);
}

/**
 * Safely parses inline ($...$) and display ($$...$$) math delimiters in text,
 * renders LaTeX math via KaTeX, and highlights search queries in non-math segments.
 */
export function renderMathInText(text: string, searchQuery?: string): string {
  if (!text) return '';

  const cleanText = sanitizeMathLatex(text);

  // Regex targeting display math $$...$$ first, then inline math $...$
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

  const parts = cleanText.split(mathRegex);

  return parts
    .map((part) => {
      if (!part) return '';

      // Display math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        const formula = part.slice(2, -2).replace(/\uE000/g, '\\$').trim();
        const rendered = renderKatexSafe(formula, true);
        if (rendered) {
          return `<span class="fus-math-block">${rendered}</span>`;
        }
        return `<code class="fus-math-raw">${escapeHtml(part).replace(/\uE000/g, '$')}</code>`;
      }

      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const formula = part.slice(1, -1).replace(/\uE000/g, '\\$').trim();
        const rendered = renderKatexSafe(formula, false);
        if (rendered) {
          return `<span class="fus-math-inline">${rendered}</span>`;
        }
        return `<code class="fus-math-raw">${escapeHtml(part).replace(/\uE000/g, '$')}</code>`;
      }

      // Plain text segment: apply query highlight if needed and restore \uE000 as literal $
      if (searchQuery && searchQuery.trim()) {
        return highlightText(part, searchQuery).replace(/\uE000/g, '$');
      }

      return escapeHtml(part).replace(/\n/g, '<br/>').replace(/\uE000/g, '$');
    })
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

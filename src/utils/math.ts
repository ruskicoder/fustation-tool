import katex from 'katex';
import { highlightText } from './highlight';

/**
 * Clean RSC JSON escape artifacts from LaTeX strings:
 * - `\u0026` / `&amp;` -> `&` (matrix column separators)
 * - `\\\\` -> `\` (double backslashes)
 */
export function sanitizeMathLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\\\\\\/g, '\\')
    .replace(/\\\\/g, '\\');
}

/**
 * Checks if a string contains any LaTeX math syntax.
 */
export function hasMathLatex(text: string): boolean {
  if (!text) return false;
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\(|\\\[|\\frac|\\sqrt|\\begin\{/i.test(text);
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
        const formula = part.slice(2, -2).trim();
        try {
          return `<span class="fus-math-block">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</span>`;
        } catch {
          return `<code class="fus-math-raw">${escapeHtml(part)}</code>`;
        }
      }

      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const formula = part.slice(1, -1).trim();
        try {
          return `<span class="fus-math-inline">${katex.renderToString(formula, { displayMode: false, throwOnError: false })}</span>`;
        } catch {
          return `<code class="fus-math-raw">${escapeHtml(part)}</code>`;
        }
      }

      // Plain text segment: apply query highlight if needed
      if (searchQuery && searchQuery.trim()) {
        return highlightText(part, searchQuery);
      }

      return escapeHtml(part).replace(/\n/g, '<br/>');
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

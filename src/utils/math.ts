import katex from 'katex';
import { highlightText } from './highlight';

/** Splits text into alternating plain and math segments; math segments keep their `$` / `$$` delimiters. */
export const MATH_SEGMENT_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

const isSpaceOrEnd = (c: string | undefined): boolean => c === undefined || /\s/.test(c);

/**
 * Returns the index of a valid inline-math closing `$` at or after `from`, or -1.
 * Pandoc rule: the closer follows a non-space and is not followed by a digit, so
 * currency like `$20000 ... $1500` never pairs up. The first `$` found decides.
 */
function findInlineCloser(s: string, from: number): number {
  for (let k = from; k < s.length; k++) {
    if (s[k] === '\n') return -1;
    if (s[k] === '$') {
      return !isSpaceOrEnd(s[k - 1]) && !/\d/.test(s[k + 1] || '') ? k : -1;
    }
  }
  return -1;
}

/**
 * Rewrites `$` delimiters so every remaining `$` belongs to a well-formed math span.
 * Unpairable dollars (currency) become the literal marker \uE000; a malformed
 * `$$x$` opener without a `$$` closer is repaired to inline `$x$`.
 */
function normalizeDollarDelimiters(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '$') {
      out += s[i++];
      continue;
    }
    if (s[i + 1] === '$') {
      const end = s.indexOf('$$', i + 2);
      if (end > i + 2) {
        out += s.slice(i, end + 2);
        i = end + 2;
        continue;
      }
      const k = isSpaceOrEnd(s[i + 2]) ? -1 : findInlineCloser(s, i + 2);
      if (k > i + 2) {
        out += '$' + s.slice(i + 2, k) + '$';
        i = k + 1;
        continue;
      }
      out += '\uE000\uE000';
      i += 2;
      continue;
    }
    const k = isSpaceOrEnd(s[i + 1]) ? -1 : findInlineCloser(s, i + 1);
    if (k > i + 1) {
      out += s.slice(i, k + 1);
      i = k + 1;
      continue;
    }
    out += '\uE000';
    i++;
  }
  return out;
}

/** Symbols without KaTeX font metrics, replaced only inside math segments. */
function fixMathSymbols(formula: string): string {
  return formula
    .replace(/½/g, '\\frac{1}{2}')
    .replace(/¼/g, '\\frac{1}{4}')
    .replace(/¾/g, '\\frac{3}{4}')
    .replace(/€/g, '\\text{EUR}')
    .replace(/₫/g, '\\text{VND}');
}

/**
 * Clean RSC JSON escape artifacts from LaTeX strings and normalize math delimiters:
 * - `\u0026` / `&amp;` -> `&` (matrix column separators)
 * - `\\\\` -> `\` (double backslashes)
 * - escaped `\$` and unpairable currency `$` -> literal marker \uE000
 */
export function sanitizeMathLatex(text: string): string {
  if (!text) return '';
  // Mask escaped currency \$ (written as \\$ or \$) with private Unicode marker \uE000 BEFORE math splitting
  const processed = text
    .replace(/\\+\$/g, '\uE000')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\\\\\\/g, '\\')
    .replace(/\\\\/g, '\\');

  return normalizeDollarDelimiters(processed)
    .split(MATH_SEGMENT_RE)
    .map((part, idx) => (idx % 2 === 1 ? fixMathSymbols(part) : part))
    .join('');
}

/**
 * Renders LaTeX formula string via KaTeX while suppressing internal missing character metric warnings.
 */
function renderKatexSafe(formula: string, displayMode: boolean, output: MathOutput): string {
  const origWarn = console.warn;
  try {
    console.warn = (...args: any[]) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('No character metrics')) {
        return;
      }
      origWarn(...args);
    };
    return katex.renderToString(formula, { displayMode, output, throwOnError: false, strict: 'ignore' });
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
 * `mathml` needs no KaTeX stylesheet, so exported HTML stays correct offline;
 * `htmlAndMathml` is for the in-page UI where `katex.min.css` is loaded.
 */
export type MathOutput = 'htmlAndMathml' | 'mathml';

/**
 * Safely parses inline ($...$) and display ($$...$$) math delimiters in text,
 * renders LaTeX math via KaTeX, and highlights search queries in non-math segments.
 */
export function renderMathInText(text: string, searchQuery?: string, output: MathOutput = 'htmlAndMathml'): string {
  if (!text) return '';

  const cleanText = sanitizeMathLatex(text);

  const parts = cleanText.split(MATH_SEGMENT_RE);

  return parts
    .map((part) => {
      if (!part) return '';

      // Display math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        const formula = part.slice(2, -2).replace(/\uE000/g, '\\$').trim();
        const rendered = renderKatexSafe(formula, true, output);
        if (rendered) {
          return `<span class="fus-math-block">${rendered}</span>`;
        }
        return `<code class="fus-math-raw">${escapeHtml(part).replace(/\uE000/g, '$')}</code>`;
      }

      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const formula = part.slice(1, -1).replace(/\uE000/g, '\\$').trim();
        const rendered = renderKatexSafe(formula, false, output);
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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

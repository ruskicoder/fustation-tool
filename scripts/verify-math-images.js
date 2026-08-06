import { sanitizeMathLatex, renderMathInText, hasMathLatex } from '../src/utils/math.js';
import { normalizeImageUrl } from '../src/utils/images.js';
import { compileMarkdown } from '../src/utils/compiler.js';
import { generatePrintHtml } from '../src/utils/exporter.js';

console.log('=== TEST 1: KaTeX LaTeX Sanitization & Detection ===');
const rawLatex = '$$\\begin{bmatrix} -x \\u0026 x+1 \\\\\\\\ 0 \\u0026 x^2 \\end{bmatrix}$$';
const sanitized = sanitizeMathLatex(rawLatex);
console.log('Raw LaTeX:', rawLatex);
console.log('Sanitized:', sanitized);
if (sanitized.includes('\\u0026') || !sanitized.includes('&')) {
  throw new Error('LaTeX sanitization failed for \\u0026');
}
console.log('✔ LaTeX sanitization passed');

const hasMath = hasMathLatex('$f(x) = x^3 + 5$');
console.log('Has Math Check:', hasMath);
if (!hasMath) throw new Error('hasMathLatex failed');
console.log('✔ hasMathLatex passed');

console.log('\n=== TEST 2: KaTeX Render Math in Text ===');
const renderedMath = renderMathInText('Find $x$ so that $f(x) = x^2$');
console.log('Rendered Math HTML:', renderedMath.slice(0, 150));
if (!renderedMath.includes('katex')) {
  throw new Error('KaTeX rendering failed: missing katex class');
}
console.log('✔ KaTeX renderMathInText passed');

console.log('\n=== TEST 3: Relative Image Path Normalization ===');
const relativePath = 'exams/fe/mae101/cmnhb6chi000004l27g5mb2rb/1785746990932_c7a8edc5ead5f5d1_MULTIPLE_CHOICE_137.png';
const normalized = normalizeImageUrl(relativePath);
console.log('Relative Path:', relativePath);
console.log('Normalized Path:', normalized);
if (!normalized || !normalized.startsWith('https://www.fustation.net/')) {
  throw new Error('Image URL normalization failed');
}
console.log('✔ Image URL normalization passed');

console.log('\n=== TEST 4: Markdown Export Generation ===');
const mockDataset = {
  id: 'test_123',
  title: 'MAE101_SP26_FE_999999',
  subjectCode: 'MAE101',
  subjectName: 'Toán cho ngành kỹ thuật',
  author: 'XAVALO',
  campus: 'XAVALO',
  term: 'SP26',
  examType: 'FE',
  examSessionTime: '09:10',
  examSessionDate: '29/04/2026',
  totalQuestions: 1,
  questions: [
    {
      index: 1,
      id: 'q1',
      text: 'Find $x$ for $f(x) = x^2$',
      imageUrl: relativePath,
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      correctAnswers: ['A'],
      options: [
        { id: 'A', text: '$x = 1$' },
        { id: 'B', text: '$x = 2$' }
      ]
    }
  ]
};

async function testExport() {
  const md = await compileMarkdown(mockDataset, false);
  console.log('Compiled Markdown Sample:\n', md);
  if (!md.includes('![Question 1 Image]') || !md.includes('Answer: A')) {
    throw new Error('compileMarkdown failed');
  }
  console.log('✔ Markdown export compilation passed');

  console.log('\n=== TEST 5: PDF HTML Generation with KaTeX ===');
  const printHtml = generatePrintHtml(mockDataset);
  if (!printHtml.includes('katex.min.css') || !printHtml.includes('katex')) {
    throw new Error('generatePrintHtml failed to embed KaTeX styles or math HTML');
  }
  console.log('✔ PDF HTML generation passed');

  console.log('\n✅ ALL MATH & IMAGE INTEGRATION TESTS PASSED CLEANLY');
}

testExport().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

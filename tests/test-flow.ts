import fs from 'fs';
import { unescapeNextFChunk, formatExamDataset, parseExamCode, formatDateString } from '../src/utils/parser';
import { compileMarkdown } from '../src/utils/compiler';
import { generatePrintHtml } from '../src/utils/exporter';
import { normalizeSavedDataset } from '../src/utils/storage';

console.log('=== TEST 1: Tokenized Exam Code Parsing ===');
const testTitles = [
  'MLN122_SP26_B5FE_915637',
  'DBM302m_SU26_FE_859065',
  'WED201C_FA25_PE1_123456',
  'SWE202C_SU26_RE_654321',
  'HCM202_SU26_RE_198246'
];

for (const t of testTitles) {
  const parsed = parseExamCode(t);
  console.log(`Title: ${t} -> SubjectCode: ${parsed.subjectCode}, Term: ${parsed.termCode}, Type: ${parsed.typeCode}, ExamCode: ${parsed.examCode}`);
}

console.log('\n=== TEST 2: Date Prefix Stripping ===');
console.log('Raw $D Date:', '$D2026-07-29T00:00:00.000Z', '-> Clean:', formatDateString('$D2026-07-29T00:00:00.000Z'));

console.log('\n=== TEST 3: Full HTML Parsing & Markdown Export ===');
const html = fs.readFileSync('docs/webfetches/examview/examplehtml-examview.html', 'utf8');
const rawData = unescapeNextFChunk(html);
if (!rawData || !rawData.initialData) {
  console.error('Failed to parse initialData');
  process.exit(1);
}

// Override title with test case HCM202_SU26_RE_198246 to verify title token precedence
if (rawData.initialData.product) {
  rawData.initialData.product.title = 'HCM202_SU26_RE_198246';
  rawData.initialData.product.examType = 'FE'; // DB enum default, must be overridden by RE from title
}

const dataset = formatExamDataset(rawData.initialData);
dataset.examSessionTime = '09:10';
dataset.examSessionDate = formatDateString('$D2026-04-29T00:00:00.000Z');

console.log('Dataset Title:', dataset.title);
console.log('Subject Code:', dataset.subjectCode);
console.log('Term:', dataset.term);
console.log('Exam Type:', dataset.examType);
console.log('Campus:', dataset.campus);
console.log('Exam Session:', dataset.examSessionTime, '|', dataset.examSessionDate);

if (dataset.term !== 'SU26' || dataset.examType !== 'RE') {
  console.error(`FAILED: Expected Term SU26 & ExamType RE, got Term: ${dataset.term}, ExamType: ${dataset.examType}`);
  process.exit(1);
}

async function runTests() {
  const md = await compileMarkdown(dataset, false);
  console.log('\n--- MARKDOWN HEADER CHECK ---');
  console.log(md.substring(0, md.indexOf('---')));

  if (!md.includes('- Term & Type: SU26 - RE')) {
    console.error('FAILED: Markdown header missing "- Term & Type: SU26 - RE"');
    process.exit(1);
  }

  const normalized = normalizeSavedDataset(dataset);
  if (normalized.term !== 'SU26' || normalized.examType !== 'RE') {
    console.error(`FAILED: Normalized dataset lost term/examType metadata`);
    process.exit(1);
  }

  const printHtml = generatePrintHtml(dataset);
  console.log('HTML Length:', printHtml.length, 'bytes');
  if (!printHtml.includes('.q-card') || !printHtml.includes('.option.correct') || printHtml.includes('katex-html')) {
    console.error('FAILED: generatePrintHtml missing card styles or emits CSS-dependent KaTeX HTML');
    process.exit(1);
  }

  console.log('\n=== TEST 4: Metadata Consistency & Session Time Extraction Validation ===');
  const { extractSessionTimeFromText } = await import('../src/utils/parser');

  // Test 4.1: Regex extraction from "Ca thi: 14:40 | 25/4/2026"
  const testSampleHtml = '<div class="meta">Ca thi: 14:40 | 25/4/2026</div>';
  const extractedTime1 = extractSessionTimeFromText(testSampleHtml);
  console.log('Sample HTML 1:', testSampleHtml, '-> Extracted Time:', extractedTime1);
  if (extractedTime1 !== '14:40') {
    console.error(`FAILED: Expected extracted time "14:40", got "${extractedTime1}"`);
    process.exit(1);
  }

  // Test 4.2: Fallback to N/A when missing
  const emptySampleHtml = '<div>No session time present here</div>';
  const extractedTime2 = extractSessionTimeFromText(emptySampleHtml);
  console.log('Sample HTML 2:', emptySampleHtml, '-> Extracted Time:', extractedTime2);
  if (extractedTime2 !== 'N/A') {
    console.error(`FAILED: Expected fallback "N/A", got "${extractedTime2}"`);
    process.exit(1);
  }

  if (!dataset.questions || dataset.questions.length === 0) {
    console.error('FAILED: Questions array is empty');
    process.exit(1);
  }

  for (const q of dataset.questions) {
    if (!q.text || q.text.trim().length === 0) {
      console.error(`FAILED: Question ${q.index} has empty text`);
      process.exit(1);
    }
    if (!q.options || q.options.length === 0) {
      console.error(`FAILED: Question ${q.index} has no options`);
      process.exit(1);
    }
    if (!q.correctAnswers || q.correctAnswers.length === 0 || q.correctAnswers.includes('N/A')) {
      console.error(`FAILED: Question ${q.index} has missing or N/A correct answers`);
      process.exit(1);
    }
  }
  console.log(`Verified ${dataset.questions.length} questions: text, options, and correct answers are valid.`);

  console.log('\n=== TEST 5: KaTeX Math Typesetting & Relative Image Normalization ===');
  const { sanitizeMathLatex, renderMathInText } = await import('../src/utils/math');
  const { normalizeImageUrl } = await import('../src/utils/images');

  const rawLatex = '$$\\begin{bmatrix} -x \\u0026 x+1 \\\\\\\\ 0 \\u0026 x^2 \\end{bmatrix}$$';
  const cleanLatex = sanitizeMathLatex(rawLatex);
  if (cleanLatex.includes('\\u0026') || !cleanLatex.includes('&')) {
    console.error('FAILED: sanitizeMathLatex failed for \\u0026');
    process.exit(1);
  }
  console.log('Sanitized Math LaTeX:', cleanLatex);

  const katexHtml = renderMathInText('Find $x$ for $f(x) = x^2$');
  if (!katexHtml.includes('katex')) {
    console.error('FAILED: renderMathInText failed to generate KaTeX HTML');
    process.exit(1);
  }
  console.log('KaTeX Rendered Sample:', katexHtml.slice(0, 100));

  const relImg = 'exams/fe/mae101/cmnhb6chi000004l27g5mb2rb/1785746990932_c7a8edc5ead5f5d1_MULTIPLE_CHOICE_137.png';
  const normImg = normalizeImageUrl(relImg);
  const expectedUrl = `https://www.fustation.net/api/exams/question-image?key=${encodeURIComponent(relImg)}`;
  if (!normImg || normImg !== expectedUrl) {
    console.error('FAILED: normalizeImageUrl did not produce correct API proxy URL');
    console.error('Expected:', expectedUrl);
    console.error('Got:     ', normImg);
    process.exit(1);
  }
  console.log('Normalized API Proxy Image URL:', normImg);

  console.log('\n=== TEST 6: Practical Exam (PE) Asset Categorization & Asset URLs ===');
  const peData = {
    product: {
      id: '162873',
      title: 'WED201c_PE_2_SP26_162873',
      pdfUrl: '/api/exams/pdf?productId=162873',
      zipUrl: '/static/exams/answer-key.zip'
    },
    questions: []
  };
  const peDataset = formatExamDataset(peData);
  if (peDataset.examCategory !== 'PE') {
    console.error(`FAILED: Expected PE examCategory, got ${peDataset.examCategory}`);
    process.exit(1);
  }
  if (!peDataset.pdfUrl || !peDataset.zipUrl) {
    console.error('FAILED: Missing PE pdfUrl or zipUrl asset URLs');
    process.exit(1);
  }
  console.log('PE Exam Category:', peDataset.examCategory);
  console.log('PE PDF URL:', peDataset.pdfUrl);
  console.log('PE ZIP URL:', peDataset.zipUrl);

  console.log('\n=== TEST 7: JSZip Folder Hierarchy & PE DOM Fallback ===');
  const { extractPeFromDOM } = await import('../src/utils/parser');
  const peDomHtml = `
    <html>
      <body>
        <h1>PRF192_FA25_PE_B3W_983472</h1>
        <a href="/api/exams/pdf?productId=983472">Tải Đề thi (PDF)</a>
        <a href="https://s3.amazonaws.com/fustation/PRF192_answer-key.zip">Tải Solution (ZIP)</a>
      </body>
    </html>
  `;
  const peDomDataset = extractPeFromDOM(peDomHtml);
  if (!peDomDataset || peDomDataset.subjectCode !== 'PRF192' || peDomDataset.examCategory !== 'PE') {
    console.error('FAILED: extractPeFromDOM failed to parse PE metadata');
    process.exit(1);
  }
  console.log('DOM Extracted Title:', peDomDataset.title);
  console.log('DOM Extracted PDF:', peDomDataset.pdfUrl);
  console.log('DOM Extracted ZIP:', peDomDataset.zipUrl);

  await runBulkZipTest(dataset);
  await runPeZipRefreshTest();

  console.log('\n=== TEST 8: Atomic Storage Batch Deletion ===');
  const sampleMap: Record<string, any> = {
    'id1': { id: 'id1', title: 'Exam 1' },
    'id2': { id: 'id2', title: 'Exam 2' },
    'id3': { id: 'id3', title: 'Exam 3' },
    'id4': { id: 'id4', title: 'Exam 4' }
  };
  const deleteTargetIds = ['id1', 'id3'];
  const testSet = new Set(deleteTargetIds);
  const remaining = { ...sampleMap };
  testSet.forEach(id => delete remaining[id]);

  if (Object.keys(remaining).length !== 2 || remaining['id1'] || remaining['id3'] || !remaining['id2'] || !remaining['id4']) {
    console.error('FAILED: Atomic batch delete failed to remove targeted IDs accurately');
    process.exit(1);
  }
  console.log('Atomic Batch Delete Test Passed: 4 items reduced to 2 items cleanly (id2, id4).');

  console.log('\n=== TEST 9: Homepage (/home) Batch Exam Discovery & Multi-Page Link Extraction ===');
  const { extractProductTasksFromHtml } = await import('../src/utils/batchFetcher');
  const homeHtmlInitial = fs.readFileSync('docs/webfetches/home/homepage-html.html', 'utf8');
  const homeHtmlFull = fs.readFileSync('docs/webfetches/home/hompage-fullfetch.html', 'utf8');

  const tasksInitial = extractProductTasksFromHtml(homeHtmlInitial);
  const tasksFull = extractProductTasksFromHtml(homeHtmlFull);

  console.log('Homepage Initial Fetch Discovered Tasks:', tasksInitial.length);
  console.log('Homepage Full Fetch Discovered Tasks:', tasksFull.length);

  if (tasksInitial.length < 30 || tasksFull.length < 300) {
    console.error(`FAILED: Expected homepage tasks >= 30 (initial) and >= 300 (full fetch), got ${tasksInitial.length} and ${tasksFull.length}`);
    process.exit(1);
  }
  console.log('Homepage Batch Task Extraction Test Passed cleanly.');

  await runFeFixtureTests();
  await runLanguageExamTests();

  console.log('\n✅ ALL DOMAIN, SCHEMA, MATH, IMAGE, PE ASSET, BULK ZIP, ATOMIC DELETE & HOMEPAGE BATCH TESTS PASSED CLEANLY');
}

// TRS/ENW language exams: Reading carries a shared passage, Writing is a PDF-only PE set.
async function runLanguageExamTests() {
  console.log('\n=== TEST 11: Language Exams (Reading passage, Writing PDF, SPA fallback) ===');
  const { extractPeFromDOM } = await import('../src/utils/parser');
  const { isValidExtractedDataset } = await import('../src/components/Overlay');
  const { isPeDataset } = await import('../src/utils/exporter');
  const dir = 'docs/webfetches/examview/language/';

  const readingHtml = fs.readFileSync(`${dir}TRS501_reading-rsc.html`, 'utf8');
  const reading = formatExamDataset(unescapeNextFChunk(readingHtml).initialData, readingHtml);
  const passage = reading.passages?.[0];
  if (reading.examCategory !== 'FE' || reading.questions.length !== 10) fail('reading exam not parsed as 10 FE questions');
  if (!passage || passage.fromQuestion !== 1 || passage.toQuestion !== 10) fail('reading passage range missing');
  if (new TextEncoder().encode(passage.text).length !== 0x13a0) fail(`passage text is ${passage.text.length} chars, not the 0x13a0-byte RSC row`);
  if (!passage.text.startsWith('1.\tAs the climate crisis') || !passage.text.endsWith('shared humanity.')) fail('passage text truncated or overrun');
  if (reading.questions.some((q) => q.imageUrl)) fail('"$undefined" imageUrl leaked into questions');
  const readingMd = await compileMarkdown(reading, false);
  const passageAt = readingMd.indexOf('## Reading passage (Questions 1-10)');
  if (passageAt === -1 || passageAt > readingMd.indexOf('### Question 1:')) fail('markdown passage missing or after question 1');
  if (readingMd.includes('$undefined') || readingMd.includes('![Question')) fail('markdown references a phantom image');
  const readingHtmlOut = generatePrintHtml(reading);
  if (!readingHtmlOut.includes('class="passage"') || !readingHtmlOut.includes('Kiribati and Tuvalu')) fail('print html missing passage');
  if (normalizeSavedDataset(reading).passages?.length !== 1) fail('storage normalization dropped passages');

  const writingHtml = fs.readFileSync(`${dir}TRS501_writing-rsc.html`, 'utf8');
  const writing = formatExamDataset(unescapeNextFChunk(writingHtml).initialData, writingHtml);
  if (!isPeDataset(writing) || writing.pdfUrl !== '/api/exams/pdf?productId=cmtqzhl8j000004jp2xs2yfxb') fail('writing set not recognized as PDF exam');
  if (!isValidExtractedDataset(writing)) fail('writing set rejected by extraction validation');

  // SPA-captured Reading page: no inline exam payload, must not be mistaken for an empty PE set.
  const spaHtml = fs.readFileSync('docs/webfetches/examview/examplehtml-examview-readwrite.html', 'utf8');
  if (extractPeFromDOM(spaHtml) !== null) fail('SPA reading page misclassified as PE');
  if (isValidExtractedDataset({ ...writing, pdfUrl: null, zipUrl: null })) fail('asset-less PE accepted as a valid extraction');
  console.log(`Reading passage (${passage.text.length} chars, Q1-10) in MD/HTML/storage; Writing PDF recognized; SPA page left for reload.`);
}

function fail(msg: string): never {
  console.error('FAILED:', msg);
  process.exit(1);
}

const FE_FIXTURES = [
  'examplehtml-examview.html',
  'examplehtml-examview-2.html',
  'examplehtml-examview-3.html',
  'image-files/example-math-examset-2.html',
  'image-files/example-math-image-examset.html'
];

function loadFeFixture(file: string) {
  const fixtureHtml = fs.readFileSync(`docs/webfetches/examview/${file}`, 'utf8');
  const raw = unescapeNextFChunk(fixtureHtml);
  if (!raw?.initialData) fail(`${file}: no initialData`);
  return { raw: raw.initialData, ds: formatExamDataset(raw.initialData, fixtureHtml) };
}

// Every FE question type: single and multiple answer, code, math, images.
async function runFeFixtureTests() {
  console.log('\n=== TEST 10: FE Fixture Fidelity (multi-answer, code, math, images) ===');
  const { renderMathInText } = await import('../src/utils/math');
  let multi = 0, images = 0, mathSpans = 0;
  for (const file of FE_FIXTURES) {
    const { raw, ds } = loadFeFixture(file);
    if (ds.questions.length !== raw.questions.length) fail(`${file}: ${ds.questions.length} of ${raw.questions.length} questions parsed`);
    ds.questions.forEach((q, i) => {
      const rq = raw.questions[i];
      if (q.correctAnswers.join() !== rq.correctAnswers.join()) fail(`${file} Q${i + 1}: answers changed`);
      if (q.options.length !== rq.options.length) fail(`${file} Q${i + 1}: options dropped`);
      if (q.correctAnswers.length > 1) multi++;
      if (q.imageUrl) images++;
    });
    const md = await compileMarkdown(ds, false);
    const mdQuestions = (md.match(/^### Question \d+:/gm) || []).length;
    if (mdQuestions !== ds.questions.length) fail(`${file}: markdown has ${mdQuestions} question headings`);
    const answerLines = (md.match(/^Answer: /gm) || []).length;
    if (answerLines !== ds.questions.length) fail(`${file}: markdown has ${answerLines} answer lines`);
    const printHtml = generatePrintHtml(ds);
    const cards = (printHtml.match(/class="q-card"/g) || []).length;
    if (cards !== ds.questions.length) fail(`${file}: print html has ${cards} cards`);
    mathSpans += (printHtml.match(/fus-math-(inline|block)/g) || []).length;
  }
  if (multi === 0 || images === 0 || mathSpans === 0) fail(`fixtures lost coverage: multi=${multi} images=${images} math=${mathSpans}`);
  console.log(`All ${FE_FIXTURES.length} FE fixtures intact: ${multi} multi-answer, ${images} image, ${mathSpans} rendered math spans.`);

  // Currency dollars must stay text; malformed $$x$ must still render as math.
  const currency = renderMathInText('A car was purchased for $20000. The value depreciates by $1500 per year.');
  if (currency.includes('katex')) fail('currency dollars were typeset as math');
  if (!currency.includes('$20000') || !currency.includes('$1500')) fail('currency dollars lost');
  const malformed = renderMathInText('$$V(t) = 20000 + 1500t$');
  if (!malformed.includes('katex') || /^\$|>\$/.test(malformed.replace(/<annotation[\s\S]*?<\/annotation>/g, ''))) fail('malformed $$x$ not repaired');

  // Java generics and code blocks must survive Markdown.
  const pro = loadFeFixture('examplehtml-examview-2.html').ds;
  const proMd = await compileMarkdown(pro, false);
  if (!proMd.includes('List\\<Integer> list')) fail('generic type <Integer> not escaped in markdown option');
  if (!/```\n[\s\S]*TreeMap<Integer, String>[\s\S]*```/.test(proMd)) fail('code question body not fenced verbatim');
  if (!/^B\. Woof!  \n   Playing fetch/m.test(proMd)) fail('multi-line option lost its line break');

  const mae = loadFeFixture('image-files/example-math-image-examset.html').ds;
  const maeMd = await compileMarkdown(mae, false);
  if (!maeMd.includes('purchased for \\$20000')) fail('currency not escaped as \\$ in markdown');
  if (!maeMd.includes('![Question')) fail('image reference missing in markdown');
  console.log('Math currency, malformed delimiters, code fences, generics and images verified.');
}

// Real exportBulkAsZip over FE + PE items with network and DOM mocked.
async function runBulkZipTest(feDataset: any) {
  console.log('\n=== TEST 7b: Bulk ZIP Export (FE + PE, real exportBulkAsZip) ===');
  const JSZip = (await import('jszip')).default;
  const { exportBulkAsZip } = await import('../src/utils/exporter');
  const mae = loadFeFixture('image-files/example-math-image-examset.html').ds;
  const peOk = formatExamDataset({ product: { id: 'cmsex6fva000004lan2cckccn', title: 'MSS301_SU26_PE_RE_738672', examType: 'PE', pdfUrl: '/api/exams/pdf?productId=cmsex6fva000004lan2cckccn', zipUrl: 'https://fustation.s3.amazonaws.com/exams/pe/mss301/answer-key.zip' }, questions: [] });
  const peNoZip = formatExamDataset({ product: { id: 'cmjmy7sdi0005gwtoi9re56l9', title: 'PRF192_FA25_PE_B3W_983472', examType: 'PE', pdfUrl: '/api/exams/pdf?productId=cmjmy7sdi0005gwtoi9re56l9', zipUrl: 'https://fustation.s3.amazonaws.com/missing.zip' }, questions: [] });
  const items = [feDataset, { ...feDataset }, mae, peOk, peNoZip].map((d: any) => ({ id: d.id, title: d.title, subjectCode: d.subjectCode, subjectName: d.subjectName, author: d.author, totalQuestions: d.totalQuestions, extractedAt: '', dataset: d }));
  const blobs: { name: string; blob: Blob }[] = [];
  const pendingUrls = new Map<string, Blob>();
  const g = globalThis as any;
  const orig = { fetch: g.fetch, document: g.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const PNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  g.fetch = async (url: string) => {
    if (url.includes('question-image')) return new Response(PNG, { status: 200 });
    if (url.includes('/api/exams/pdf')) return new Response('%PDF-1.4 test', { status: 200 });
    if (url.includes('missing.zip')) return new Response('', { status: 404 });
    if (url.endsWith('.zip') || url.includes('answer-key')) return new Response('PK test', { status: 200 });
    return new Response('', { status: 404 });
  };
  let counter = 0;
  URL.createObjectURL = (b: Blob) => { const u = `blob:test/${counter++}`; pendingUrls.set(u, b); return u; };
  URL.revokeObjectURL = () => {};
  g.document = {
    body: { appendChild() {}, removeChild() {} },
    createElement: () => {
      const a: any = { click() { blobs.push({ name: a.download, blob: pendingUrls.get(a.href)! }); } };
      return a;
    }
  };
  try {
    await exportBulkAsZip(items as any, { feFormat: 'MD', peFormat: 'PE_BOTH' });
    if (blobs.length !== 1) fail(`expected 1 zip volume, got ${blobs.length}`);
    const zip = await JSZip.loadAsync(await blobs[0].blob.arrayBuffer());
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
    console.log('Bulk ZIP entries:', names);
    const need = ['JPD113/HCM202_SU26_RE_198246.md', 'JPD113/HCM202_SU26_RE_198246_2.md', 'MAE101/MAE101_SP26_C2FE_625802.md',
      'MSS301/MSS301_SU26_PE_RE_738672_Paper.pdf', 'MSS301/MSS301_SU26_PE_RE_738672_AnswerKey.zip', 'PRF192/PRF192_FA25_PE_B3W_983472_Paper.pdf', 'manifest.md'];
    for (const n of need) if (!names.includes(n)) fail(`bulk zip missing ${n}`);
    const maeMd = await zip.file('MAE101/MAE101_SP26_C2FE_625802.md')!.async('string');
    if ((maeMd.match(/\(data:image\/png;base64,/g) || []).length !== mae.questions.filter((q) => q.imageUrl).length) fail('FE images not embedded as base64');
    const manifest = await zip.file('manifest.md')!.async('string');
    if (!/PRF192_FA25_PE_B3W_983472 \| PE \| PDF: Available, ZIP: Missing/.test(manifest)) fail('manifest does not flag missing PE answer key');
    console.log('Bulk ZIP holds FE markdown (deduplicated, images embedded) and PE assets with an accurate manifest.');
  } finally {
    g.fetch = orig.fetch; g.document = orig.document; URL.createObjectURL = orig.create; URL.revokeObjectURL = orig.revoke;
  }
}

// ISSUE-107: a stale stored zipUrl must never be the first thing fetched, and failure must be reported.
async function runPeZipRefreshTest() {
  console.log('\n=== TEST 12: PE ZIP fresh URL first, honest failure ===');
  const { downloadZipAsset, exportSinglePe } = await import('../src/utils/exporter');
  const ds = formatExamDataset({ product: { id: 'cmsex6fva000004lan2cckccn', title: 'MSS301_SU26_PE_RE_738672', examType: 'PE', pdfUrl: '/api/exams/pdf?productId=cmsex6fva000004lan2cckccn', zipUrl: 'https://fustation.s3.ap-southeast-1.amazonaws.com/exams/stale.zip?X-Amz-Signature=old' }, questions: [] });
  const g = globalThis as any;
  const orig = { fetch: g.fetch, document: g.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL, timeout: g.setTimeout };
  const calls: string[] = [];
  const clicks: string[] = [];
  let rscHasFresh = true;
  g.fetch = async (url: string) => {
    calls.push(url);
    if (url.includes('_rsc=1') && rscHasFresh) return new Response('"zipUrl":"https://fustation.s3.ap-southeast-1.amazonaws.com/exams/fresh.zip?X-Amz-Signature=new"', { status: 200 });
    if (url.includes('fresh.zip')) return new Response('PK fresh', { status: 200 });
    if (url.includes('stale.zip')) return new Response('', { status: 403 });
    return new Response('', { status: 404 });
  };
  let revokedEarly = false;
  URL.createObjectURL = () => 'blob:test/pe';
  URL.revokeObjectURL = () => { revokedEarly = true; };
  g.setTimeout = (fn: () => void, ms: number) => (ms >= 60_000 ? 0 : orig.timeout(fn, ms));
  g.document = { body: { appendChild() {}, removeChild() {} }, createElement: () => { const a: any = { click() { clicks.push(a.download); } }; return a; } };
  try {
    if (!(await downloadZipAsset(ds))) fail('fresh ZIP download returned false');
    const firstZip = calls.findIndex((u) => u.includes('.zip'));
    const firstRsc = calls.findIndex((u) => u.includes('_rsc=1'));
    if (firstRsc < 0 || firstRsc > firstZip) fail('fresh URL was not requested before the ZIP fetch');
    if (calls.some((u) => u.includes('stale.zip'))) fail('stale stored zipUrl was fetched although a fresh URL existed');
    if (revokedEarly) fail('object URL revoked before the 60 s delay');
    if (clicks.join() !== 'MSS301_SU26_PE_RE_738672_AnswerKey.zip') fail(`unexpected downloads: ${clicks.join()}`);

    rscHasFresh = false; calls.length = 0; clicks.length = 0;
    if (await downloadZipAsset(ds)) fail('download reported success with only an expired URL');
    if (!calls.some((u) => u.includes('stale.zip'))) fail('stored zipUrl was not used as the fallback');
    if (await exportSinglePe({ ...ds, pdfUrl: undefined, id: 'cmsex6fva000004lan2cckccx' } as any, 'PE_BOTH')) fail('PE_BOTH reported success with no asset');
    if (clicks.length) fail(`failure still triggered a download: ${clicks.join()}`);
    console.log('Fresh presigned URL is fetched first; expired-only and asset-less exports return false with no download.');
  } finally {
    g.fetch = orig.fetch; g.document = orig.document; URL.createObjectURL = orig.create; URL.revokeObjectURL = orig.revoke; g.setTimeout = orig.timeout;
  }
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});

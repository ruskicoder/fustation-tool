import { ExamDataset, ExportFormat } from '../types';
import { compileMarkdown } from './compiler';

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

export function generatePrintHtml(dataset: ExamDataset): string {
  const subjectStr = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const termStr = dataset.term || dataset.termCode || 'SP26';
  const typeStr = dataset.examType || 'FE';
  const termTypeStr = `${termStr} - ${typeStr}`;
  let questionsHtml = '';

  (dataset.questions || []).forEach((q, idx) => {
    const qNum = idx + 1;
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    
    let optionsHtml = '';
    (q.options || []).forEach((opt) => {
      const isCorrect = (q.correctAnswers || []).includes(opt.id);
      optionsHtml += `
        <div class="option ${isCorrect ? 'correct' : ''}">
          <span class="badge">${opt.id}</span>
          <span class="opt-text">${opt.text}</span>
        </div>`;
    });

    const imgHtml = q.imageUrl ? `<img src="${q.imageUrl}" class="q-img" />` : '';

    questionsHtml += `
      <div class="q-card">
        <h3 class="q-title">Câu hỏi ${qNum}: ${q.text}</h3>
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
  <title>${dataset.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 24px; margin: 0 0 8px 0; color: #0f172a; }
    .meta { font-size: 14px; color: #64748b; margin: 4px 0; }
    .q-card { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .q-title { font-size: 16px; margin: 0 0 12px 0; color: #0f172a; }
    .q-img { max-width: 100%; height: auto; margin-bottom: 12px; border-radius: 6px; }
    .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .option { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: 6px; border: 1px solid #f1f5f9; background: #f8fafc; font-size: 14px; }
    .option.correct { border-color: #10b981; background: #ecfdf5; color: #065f46; font-weight: 600; }
    .badge { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 50%; background: #e2e8f0; color: #334155; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .option.correct .badge { background: #10b981; color: #fff; }
    .answer-key { font-size: 13px; color: #047857; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
    @media print {
      body { margin: 0; }
      .q-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${dataset.title}</h1>
    <div class="meta"><strong>Môn học:</strong> ${subjectStr} | <strong>Học kỳ & Loại thi:</strong> ${termTypeStr}</div>
    <div class="meta"><strong>Cơ sở / Nguồn:</strong> ${dataset.campus || dataset.author || 'XAVALO'} | <strong>Số câu hỏi:</strong> ${dataset.totalQuestions}</div>
  </div>
  ${questionsHtml}
</body>
</html>`;
}

export function exportExam(dataset: ExamDataset, format: ExportFormat = 'MD'): void {
  if (!dataset) return;
  const subjCode = (dataset.subjectCode || 'EXAM').toUpperCase();
  const cleanTitle = (dataset.title || 'exam').replace(/[^a-zA-Z0-9_-]/g, '_');

  let filename = cleanTitle;
  if (!cleanTitle.toUpperCase().startsWith(subjCode)) {
    filename = `${subjCode}_${cleanTitle}`;
  }

  if (format === 'JSON') {
    const jsonStr = JSON.stringify(dataset, null, 2);
    downloadBlob(jsonStr, `${filename}.json`, 'application/json');
  } else if (format === 'PDF') {
    const htmlStr = generatePrintHtml(dataset);
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlStr);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    }
  } else {
    // Default MD
    const mdStr = compileMarkdown(dataset);
    downloadBlob(mdStr, `${filename}.md`, 'text/markdown;charset=utf-8');
  }
}

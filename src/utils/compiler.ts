import { ExamDataset } from '../types';
import { sanitizeMathLatex } from './math';
import { normalizeImageUrl, fetchImageAsBase64 } from './images';

export async function compileMarkdown(dataset: ExamDataset, embedImages: boolean = true): Promise<string> {
  if (!dataset) return '';

  const subject = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const campus = dataset.campus || dataset.author || 'XAVALO';
  const termStr = dataset.term || dataset.termCode || 'SP26';
  const examType = dataset.examType || 'FE';
  const session = `${dataset.examSessionTime || 'N/A'} | ${dataset.examSessionDate || '29/04/2026'}`;

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
    const cleanText = sanitizeMathLatex(q.text || '').replace(/[\uE000]|&#36;/g, '\\$').trim();
    const qTitle = cleanText || '[ Question Illustration ]';

    lines.push(`### Question ${qNum}: ${qTitle}`);
    lines.push(``);

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

    (q.options || []).forEach((opt) => {
      const optText = sanitizeMathLatex(opt.text || '').replace(/[\uE000]|&#36;/g, '\\$');
      lines.push(`${opt.id}. ${optText}`);
    });

    lines.push(``);
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    lines.push(`Answer: ${answers}`);
    lines.push(``);
  }

  return lines.join('\n');
}

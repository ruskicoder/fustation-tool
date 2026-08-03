import { ExamDataset } from '../types';

export function compileMarkdown(dataset: ExamDataset): string {
  if (!dataset) return '';

  const subject = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const campus = dataset.campus || dataset.author || 'XAVALO';
  const termStr = dataset.term || dataset.termCode || 'SP26';
  const examType = dataset.examType || 'FE';
  const session = `${dataset.examSessionTime || '09:10'} | ${dataset.examSessionDate || '29/04/2026'}`;

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

  (dataset.questions || []).forEach((q, idx) => {
    const qNum = idx + 1;
    lines.push(`### Question ${qNum}: ${q.text}`);
    lines.push(``);

    if (q.imageUrl) {
      lines.push(`![Question Image](${q.imageUrl})`);
      lines.push(``);
    }

    (q.options || []).forEach((opt) => {
      lines.push(`${opt.id}. ${opt.text}`);
    });

    lines.push(``);
    const answers = (q.correctAnswers || []).join(', ') || 'N/A';
    lines.push(`Answer: ${answers}`);
    lines.push(``);
  });

  return lines.join('\n');
}

import { ExamDataset } from '../types';

export function compileMarkdown(dataset: ExamDataset): string {
  if (!dataset) return '';

  const subject = `${dataset.subjectCode} - ${dataset.subjectName}`;
  const lines: string[] = [
    `# [info]`,
    `- Subject: ${subject}`,
    `- Title: ${dataset.title}`,
    `- Author: ${dataset.author || 'XAVALO'}`,
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

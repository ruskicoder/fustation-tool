export type ExportFormat = 'MD' | 'PDF' | 'JSON';

export type StatusState = 'ready' | 'fetching' | 'processing' | 'downloading' | 'extracted' | 'error';

export interface Option {
  id: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  index: number;
  id: string;
  text: string;
  imageUrl: string | null;
  correctAnswers: string[];
  options: Option[];
}

export interface ExamDataset {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  author: string; // Campus / Uploader (e.g. "XAVALO")
  totalQuestions: number;
  questions: Question[];
}

export interface SavedExamItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  author: string;
  totalQuestions: number;
  extractedAt: string;
  dataset: ExamDataset;
}

export type SavedExamsMap = Record<string, SavedExamItem>;

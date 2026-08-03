export type ExportFormat = 'MD' | 'PDF' | 'JSON';

export type StatusState = 'ready' | 'fetching' | 'autosaving' | 'processing' | 'downloading' | 'extracted' | 'error';

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
  campus?: string;
  examType?: string;
  examSessionTime?: string;
  examSessionDate?: string;
  parsedTitle?: string;
  totalQuestions: number;
  isPartial?: boolean;
  successFetchCount?: number;
  failedFetchCount?: number;
  questions: Question[];
}

export interface SavedExamItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  author: string;
  campus?: string;
  examType?: string;
  examSessionTime?: string;
  examSessionDate?: string;
  totalQuestions: number;
  isPartial?: boolean;
  successFetchCount?: number;
  failedFetchCount?: number;
  extractedAt: string;
  dataset: ExamDataset;
}

export type SavedExamsMap = Record<string, SavedExamItem>;

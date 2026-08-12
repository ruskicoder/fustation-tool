export type FEFormat = 'MD' | 'PDF' | 'JSON';
export type PEFormat = 'PE_PDF' | 'PE_ZIP' | 'PE_BOTH';
export type ExportFormat = FEFormat | PEFormat;

export type StatusState = 'ready' | 'fetching' | 'autosaving' | 'processing' | 'downloading' | 'extracted' | 'error' | 'batch_fetching';

export type ExtractMode = 'single' | 'batch';

export type BatchFetchStatus =
  | 'idle'
  | 'discovering'
  | 'preview_fetching'
  | 'preview_paused'
  | 'batch_fetching'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface BatchItemTask {
  id: string;
  title: string;
  subjectCode?: string;
  examUrl: string;
  rscUrl: string;
}

export interface BatchState {
  status: BatchFetchStatus;
  isPreviewEnabled: boolean;
  previewCount: number;
  totalDiscovered: number;
  completedCount: number;
  logs: string[];
  previewDatasets: ExamDataset[];
  previewIndex: number;
}

/** Surface themes. `glass-dark` is the default; clicking the header logo cycles them. */
export type ThemeName = 'glass-dark' | 'glass-light' | 'neu-light' | 'neu-dark';

export const THEME_ORDER: ThemeName[] = ['glass-dark', 'glass-light', 'neu-light', 'neu-dark'];

export const THEME_LABELS: Record<ThemeName, string> = {
  'glass-dark': 'Glass · Dark',
  'glass-light': 'Glass · Light',
  'neu-light': 'Soft UI · Light',
  'neu-dark': 'Soft UI · Dark'
};

/** Persisted panel position + size, in viewport pixels, top-left anchored. */
export interface PanelGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PANEL_MIN_W = 380;
export const PANEL_MIN_H = 240;
export const PANEL_DEFAULT_W = 600;
export const PANEL_DEFAULT_H = 330;

/** Exam View Panel (viewer) geometry defaults. */
export const VIEWER_MIN_W = 420;
export const VIEWER_MIN_H = 300;
export const VIEWER_DEFAULT_W = 680;
export const VIEWER_DEFAULT_H = 520;

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface Option {
  id: string; // "A", "B", "C", "D"
  text: string;
}

export interface Question {
  index: number;
  id: string;
  text: string;
  imageUrl: string | null;
  imageBase64?: string | null;
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
  term?: string;
  termCode?: string;
  examType?: string;
  examCategory?: 'FE' | 'PE';
  pdfUrl?: string | null;
  zipUrl?: string | null;
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
  term?: string;
  termCode?: string;
  examType?: string;
  examCategory?: 'FE' | 'PE';
  pdfUrl?: string | null;
  zipUrl?: string | null;
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

export type BatchStatus = 'standby' | 'compiling' | 'downloading' | 'done' | 'failed' | 'retrying';

export interface BatchProgressState {
  totalItems: number;
  completedItems: number;
  currentBatchIndex: number;
  totalBatches: number;
  batchStatus: BatchStatus;
  currentExamCode: string;
  currentLogNote: string;
  isPaused: boolean;
  isCanceled: boolean;
  isDrawerExpanded: boolean;
  logs: string[];
}

export type ExportProgressCallback = (progress: BatchProgressState) => void;

export interface AssetFetchResult {
  buffer: ArrayBuffer | null;
  status: 'available' | 'missing';
  attempts: number;
  url: string;
  targetFilename?: string;
}


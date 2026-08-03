import { ExamDataset, ExportFormat, SavedExamsMap } from '../types';

const STORAGE_KEYS = {
  SAVED_EXAMS: 'fustation_saved_exams',
  ACTIVE_FORMAT: 'fustation_active_format',
  PANEL_EXPANDED: 'fustation_panel_expanded',
  ACTIVE_TAB: 'fustation_active_tab',
  PENDING_FETCH: 'fustation_pending_fetch'
};

export function normalizeSavedDataset(dataset: any): ExamDataset {
  if (!dataset) {
    return {
      id: 'unknown',
      title: 'Exam Set',
      subjectCode: 'EXAM',
      subjectName: 'Subject',
      author: 'XAVALO',
      campus: 'XAVALO',
      term: 'SP26',
      termCode: 'SP26',
      examType: 'FE',
      examSessionTime: '09:10',
      examSessionDate: '29/04/2026',
      parsedTitle: 'Exam Set',
      totalQuestions: 0,
      questions: []
    };
  }

  const rawId = dataset.id;
  const safeId = (rawId && rawId !== 'unknown')
    ? rawId
    : `exam_${(dataset.subjectCode || 'EXAM').toUpperCase()}_${Date.now()}`;

  return {
    id: safeId,
    title: dataset.title || 'Exam Set',
    subjectCode: dataset.subjectCode || 'EXAM',
    subjectName: dataset.subjectName || 'Subject',
    author: dataset.author || 'XAVALO',
    campus: dataset.campus || dataset.author || 'XAVALO',
    term: dataset.term || dataset.termCode || 'SP26',
    termCode: dataset.termCode || dataset.term || 'SP26',
    examType: dataset.examType || 'FE',
    examSessionTime: dataset.examSessionTime || 'N/A',
    examSessionDate: dataset.examSessionDate || '29/04/2026',
    parsedTitle: dataset.parsedTitle || dataset.title || 'Exam Set',
    totalQuestions: dataset.totalQuestions || (dataset.questions ? dataset.questions.length : 0),
    isPartial: dataset.isPartial || false,
    successFetchCount: dataset.successFetchCount,
    failedFetchCount: dataset.failedFetchCount,
    questions: dataset.questions || []
  };
}

export function saveExamToStorage(dataset: ExamDataset, callback?: (exams: SavedExamsMap) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback({});
    return;
  }

  const normalized = normalizeSavedDataset(dataset);
  dataset.id = normalized.id;

  getSavedExamsFromStorage((exams) => {
    // Produce a new shallow map copy to ensure React state identity changes
    const list: SavedExamsMap = { ...(exams || {}) };
    list[normalized.id] = {
      id: normalized.id,
      title: normalized.title,
      subjectCode: normalized.subjectCode,
      subjectName: normalized.subjectName,
      author: normalized.author,
      campus: normalized.campus,
      term: normalized.term,
      termCode: normalized.termCode,
      examType: normalized.examType,
      examSessionTime: normalized.examSessionTime,
      examSessionDate: normalized.examSessionDate,
      totalQuestions: normalized.totalQuestions,
      isPartial: normalized.isPartial,
      successFetchCount: normalized.successFetchCount,
      failedFetchCount: normalized.failedFetchCount,
      extractedAt: new Date().toLocaleString(),
      dataset: normalized
    };

    chrome.storage.local.set({ [STORAGE_KEYS.SAVED_EXAMS]: list }, () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
        console.error('[fustation-tool] Storage write error:', chrome.runtime.lastError);
      }
      if (callback) callback(list);
    });
  });
}

export function getSavedExamsFromStorage(callback: (exams: SavedExamsMap) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    callback({});
    return;
  }

  chrome.storage.local.get([STORAGE_KEYS.SAVED_EXAMS], (res) => {
    callback(res[STORAGE_KEYS.SAVED_EXAMS] || {});
  });
}

export function deleteExamFromStorage(examId: string, callback?: (exams: SavedExamsMap) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback({});
    return;
  }

  getSavedExamsFromStorage((exams) => {
    const list = exams || {};
    delete list[examId];
    chrome.storage.local.set({ [STORAGE_KEYS.SAVED_EXAMS]: list }, () => {
      if (callback) callback(list);
    });
  });
}

export function clearAllExamsFromStorage(callback?: () => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback();
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEYS.SAVED_EXAMS]: {} }, () => {
    if (callback) callback();
  });
}

export function getActiveFormatFromStorage(callback: (format: ExportFormat) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    callback('MD');
    return;
  }

  chrome.storage.local.get([STORAGE_KEYS.ACTIVE_FORMAT], (res) => {
    callback((res[STORAGE_KEYS.ACTIVE_FORMAT] as ExportFormat) || 'MD');
  });
}

export function setActiveFormatInStorage(format: ExportFormat, callback?: () => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback();
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_FORMAT]: format }, () => {
    if (callback) callback();
  });
}

export function getPanelStateFromStorage(
  callback: (state: { isExpanded: boolean; activeTab: 'extract' | 'saved' }) => void
): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    callback({ isExpanded: false, activeTab: 'extract' });
    return;
  }

  chrome.storage.local.get([STORAGE_KEYS.PANEL_EXPANDED, STORAGE_KEYS.ACTIVE_TAB], (res) => {
    const isExpanded = typeof res[STORAGE_KEYS.PANEL_EXPANDED] === 'boolean' ? res[STORAGE_KEYS.PANEL_EXPANDED] : false;
    const activeTab = res[STORAGE_KEYS.ACTIVE_TAB] === 'saved' ? 'saved' : 'extract';
    callback({ isExpanded, activeTab });
  });
}

export function setPanelStateInStorage(
  state: { isExpanded?: boolean; activeTab?: 'extract' | 'saved' },
  callback?: () => void
): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback();
    return;
  }

  const payload: Record<string, any> = {};
  if (typeof state.isExpanded === 'boolean') {
    payload[STORAGE_KEYS.PANEL_EXPANDED] = state.isExpanded;
  }
  if (state.activeTab) {
    payload[STORAGE_KEYS.ACTIVE_TAB] = state.activeTab;
  }

  if (Object.keys(payload).length > 0) {
    chrome.storage.local.set(payload, () => {
      if (callback) callback();
    });
  } else if (callback) {
    callback();
  }
}

export function getPendingFetchFromStorage(callback: (pending: boolean) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    callback(false);
    return;
  }

  chrome.storage.local.get([STORAGE_KEYS.PENDING_FETCH], (res) => {
    callback(!!res[STORAGE_KEYS.PENDING_FETCH]);
  });
}

export function setPendingFetchInStorage(pending: boolean, callback?: () => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback();
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEYS.PENDING_FETCH]: pending }, () => {
    if (callback) callback();
  });
}


import { ExamDataset, ExportFormat, SavedExamsMap } from '../types';

const STORAGE_KEYS = {
  SAVED_EXAMS: 'fustation_saved_exams',
  ACTIVE_FORMAT: 'fustation_active_format'
};

export function saveExamToStorage(dataset: ExamDataset, callback?: (exams: SavedExamsMap) => void): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    if (callback) callback({});
    return;
  }

  getSavedExamsFromStorage((exams) => {
    const list = exams || {};
    list[dataset.id] = {
      id: dataset.id,
      title: dataset.title,
      subjectCode: dataset.subjectCode,
      subjectName: dataset.subjectName,
      author: dataset.author,
      totalQuestions: dataset.totalQuestions,
      extractedAt: new Date().toLocaleString(),
      dataset: dataset
    };

    chrome.storage.local.set({ [STORAGE_KEYS.SAVED_EXAMS]: list }, () => {
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

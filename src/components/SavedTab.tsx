import React from 'react';
import { ExportFormat, SavedExamsMap } from '../types';
import { FormatSwitcher } from './FormatSwitcher';

interface SavedTabProps {
  savedExams: SavedExamsMap;
  activeFormat: ExportFormat;
  onFormatChange: (fmt: ExportFormat) => void;
  onClearAll: () => void;
  onDeleteItem: (examId: string) => void;
  onExportItem: (examId: string) => void;
}

export const SavedTab: React.FC<SavedTabProps> = ({
  savedExams,
  activeFormat,
  onFormatChange,
  onClearAll,
  onDeleteItem,
  onExportItem
}) => {
  const savedList = Object.values(savedExams || {});

  return (
    <div className="fus-saved-wrapper">
      {/* Sticky Top Toolbar */}
      <div className="fus-saved-header-sticky">
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--fus-text-dim)', whiteSpace: 'nowrap' }}>
          Saved ({savedList.length})
        </span>

        <div style={{ flex: 1, maxWidth: '200px' }}>
          <FormatSwitcher currentFormat={activeFormat} onChange={onFormatChange} />
        </div>

        <button
          type="button"
          className="fus-btn-danger"
          title="Clear all saved exams"
          onClick={onClearAll}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear all
        </button>
      </div>

      {/* Scrollable Saved Items List */}
      <div className="fus-saved-list">
        {savedList.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px' }}>
            No saved exams in local cache
          </div>
        ) : (
          savedList.map((item) => (
            <div key={item.id} className="fus-saved-row">
              <span className="fus-badge fus-badge-subject">{item.subjectCode || 'EXAM'}</span>
              <span className="fus-saved-code" title={item.title}>{item.title}</span>
              <span style={{ fontSize: '10px', color: 'var(--fus-text-dim)' }}>{item.totalQuestions || 0}Q</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* 1. Delete Button */}
                <button
                  type="button"
                  className="fus-ctrl-btn fus-btn-danger-icon"
                  title="Delete item"
                  onClick={() => onDeleteItem(item.id)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>

                {/* 2. Download Button */}
                <button
                  type="button"
                  className="fus-ctrl-btn"
                  title={`Export in ${activeFormat}`}
                  onClick={() => onExportItem(item.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

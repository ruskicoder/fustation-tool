import React from 'react';
import { ExportFormat, SavedExamsMap } from '../types';
import { FormatSwitcher } from './FormatSwitcher';

interface SavedTabProps {
  savedExams: SavedExamsMap;
  activeFormat: ExportFormat;
  onFormatChange: (fmt: ExportFormat) => void;
  onClearAll: () => void;
  onExportItem: (examId: string) => void;
}

export const SavedTab: React.FC<SavedTabProps> = ({
  savedExams,
  activeFormat,
  onFormatChange,
  onClearAll,
  onExportItem
}) => {
  const savedList = Object.values(savedExams || {});

  return (
    <div className="fus-saved-container">
      <div className="fus-saved-header">
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--fus-text-dim)' }}>
          Saved Exams ({savedList.length})
        </span>

        <FormatSwitcher currentFormat={activeFormat} onChange={onFormatChange} />

        <button
          type="button"
          className="fus-ctrl-btn fus-close-btn"
          style={{ padding: '4px 8px', width: 'auto', fontSize: '11px' }}
          onClick={onClearAll}
        >
          Clear all
        </button>
      </div>

      {savedList.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px' }}>
          No saved exams in cache
        </div>
      ) : (
        savedList.map((item) => (
          <div key={item.id} className="fus-saved-row">
            <span className="fus-badge fus-badge-subject">{item.subjectCode || 'EXAM'}</span>
            <span className="fus-saved-code" title={item.title}>{item.title}</span>
            <span style={{ fontSize: '10px', color: 'var(--fus-text-dim)' }}>{item.totalQuestions || 0}Q</span>
            <button
              type="button"
              className="fus-ctrl-btn"
              title={`Export in ${activeFormat}`}
              onClick={() => onExportItem(item.id)}
            >
              📥
            </button>
          </div>
        ))
      )}
    </div>
  );
};

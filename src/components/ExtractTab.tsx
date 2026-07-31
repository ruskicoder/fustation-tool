import React from 'react';
import { ExamDataset, ExportFormat } from '../types';
import { FormatSwitcher } from './FormatSwitcher';

interface ExtractTabProps {
  dataset: ExamDataset | null;
  activeFormat: ExportFormat;
  onFormatChange: (fmt: ExportFormat) => void;
  onFetch: () => void;
  onDownload: () => void;
}

export const ExtractTab: React.FC<ExtractTabProps> = ({
  dataset,
  activeFormat,
  onFormatChange,
  onFetch,
  onDownload
}) => {
  const data = dataset || {
    subjectCode: 'EXAM',
    subjectName: 'No active exam page detected',
    author: 'XAVALO',
    title: 'Open an exam page on fustation.net',
    totalQuestions: 0
  };

  return (
    <div className="fus-body-grid">
      {/* Left Panel Metadata (No metric boxes) */}
      <div className="fus-left-panel">
        <div className="fus-badge-row">
          <span className="fus-badge fus-badge-subject">{data.subjectCode}</span>
          <span className="fus-badge fus-badge-campus">{data.author || 'XAVALO'}</span>
        </div>
        <p className="fus-subject-title">{data.subjectName}</p>
        <p className="fus-exam-code" title={data.title}>{data.title}</p>
        <span className="fus-q-count">{data.totalQuestions} Questions</span>
      </div>

      {/* Divider */}
      <div className="fus-divider" />

      {/* Right Panel Actions */}
      <div className="fus-right-panel">
        <div className="fus-switcher-wrapper">
          <span className="fus-switcher-label">Export format</span>
          <FormatSwitcher currentFormat={activeFormat} onChange={onFormatChange} />
        </div>

        <div className="fus-action-row">
          <button type="button" className="fus-btn-sec" onClick={onFetch}>
            🔄 Fetch
          </button>
          <button type="button" className="fus-btn-primary" onClick={onDownload}>
            📥 Download
          </button>
        </div>
      </div>
    </div>
  );
};

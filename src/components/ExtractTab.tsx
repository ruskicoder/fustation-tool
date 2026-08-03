import React from 'react';
import { ExamDataset, ExportFormat } from '../types';
import { FormatSwitcher } from './FormatSwitcher';

interface ExtractTabProps {
  dataset: ExamDataset | null;
  activeFormat: ExportFormat;
  onFormatChange: (fmt: ExportFormat) => void;
  onFetch: () => void;
  onSave: () => void;
  onDownload: () => void;
}

export const ExtractTab: React.FC<ExtractTabProps> = ({
  dataset,
  activeFormat,
  onFormatChange,
  onFetch,
  onSave,
  onDownload
}) => {
  const data: ExamDataset = dataset || {
    id: 'unknown',
    subjectCode: 'EXAM',
    subjectName: 'No active exam page detected',
    author: 'XAVALO',
    campus: 'XAVALO',
    examType: 'FE',
    examSessionTime: '09:10',
    examSessionDate: '29/04/2026',
    title: 'Open an exam page on fustation.net',
    totalQuestions: 0,
    isPartial: false,
    successFetchCount: 0,
    failedFetchCount: 0,
    questions: []
  };

  const termExamType = `SP26 - ${data.examType || 'FE'}`;
  const sessionStr = `${data.examSessionTime || '09:10'} | ${data.examSessionDate || '29/04/2026'}`;

  return (
    <div className="fus-body-grid">
      {/* Left Panel Metadata (5-Row Structured Layout) */}
      <div className="fus-left-panel">
        {/* Row 1: 30% / 40% / 30% grid */}
        <div className="fus-meta-row-1">
          <span className="fus-badge fus-badge-subject" title="Subject Code">{data.subjectCode}</span>
          <span className="fus-badge fus-badge-type" title="Term & Exam Type">{termExamType}</span>
          <span className="fus-badge fus-badge-campus" title="Campus">{data.campus || data.author || 'XAVALO'}</span>
        </div>

        {/* Row 2: 70% / 30% grid */}
        <div className="fus-meta-row-2">
          <span className="fus-meta-date" title="Exam Session Date">{sessionStr}</span>
          <span className="fus-q-count" title="Question Count">{data.totalQuestions} Questions</span>
        </div>

        {/* Row 3: Full Width Subject Name */}
        <p className="fus-subject-title" title={data.subjectName}>{data.subjectName}</p>

        {/* Row 4: Full Width Exam Code */}
        <p className="fus-exam-code" title={data.title}>{data.title}</p>

        {/* Temporary Metadata if Partial Fetch */}
        {data.isPartial && (
          <p className="fus-meta-partial" title="Partial fetch warning">
            Fetched with fails: {data.successFetchCount || (data.questions ? data.questions.length : 0)} ✓ | {data.failedFetchCount || 0} ✗
          </p>
        )}

        {/* Hairline Divider */}
        <div className="fus-left-divider" />

        {/* Row 5: View Questions Placeholder Button */}
        <button
          type="button"
          className="fus-btn-placeholder-view"
          disabled
          title="ExamSet Viewing feature coming soon"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Questions
        </button>
      </div>

      {/* Divider */}
      <div className="fus-divider" />

      {/* Right Panel Actions */}
      <div className="fus-right-panel">
        <div className="fus-switcher-wrapper">
          <span className="fus-switcher-label">Export format</span>
          <FormatSwitcher currentFormat={activeFormat} onChange={onFormatChange} />
        </div>

        <div className="fus-action-stack">
          <div className="fus-action-row">
            <button type="button" className="fus-btn-sec" onClick={onFetch}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Fetch
            </button>
            <button type="button" className="fus-btn-sec" onClick={onSave}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
          </div>

          <button type="button" className="fus-btn-primary" onClick={onDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

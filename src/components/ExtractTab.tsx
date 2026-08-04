import React from 'react';
import { ExamDataset, StatusState } from '../types';
import { RefreshIcon, SaveIcon, DownloadIcon, EyeIcon } from './Icons';
import { MetaSkeleton } from './Skeleton';

interface ExtractTabProps {
  dataset: ExamDataset | null;
  status?: StatusState;
  onFetch: () => void;
  onSave: () => void;
  onDownload: () => void;
  onView: () => void;
}

export const ExtractTab: React.FC<ExtractTabProps> = ({
  dataset,
  status,
  onFetch,
  onSave,
  onDownload,
  onView
}) => {
  const data: ExamDataset = dataset || {
    id: 'unknown',
    subjectCode: 'EXAM',
    subjectName: 'No active exam page detected',
    author: 'XAVALO',
    campus: 'XAVALO',
    term: 'SP26',
    termCode: 'SP26',
    examType: 'FE',
    examSessionTime: 'N/A',
    examSessionDate: '29/04/2026',
    title: 'Open an exam page on fustation.net',
    totalQuestions: 0,
    isPartial: false,
    successFetchCount: 0,
    failedFetchCount: 0,
    questions: []
  };

  const termStr = data.term || data.termCode || 'SP26';
  const typeStr = data.examType || 'FE';
  const termExamType = `${termStr} - ${typeStr}`;
  const sessionStr = `${data.examSessionTime || 'N/A'} | ${data.examSessionDate || '29/04/2026'}`;
  const isLoading = status === 'fetching' || status === 'processing';
  const hasQuestions = !!(dataset && dataset.questions && dataset.questions.length > 0);

  return (
    <div className="fus-body-grid">
      {/* Left Panel Metadata */}
      <div className="fus-left-panel">
        {isLoading ? (
          <MetaSkeleton />
        ) : (
          <>
            {/* Row 1: 30% / 40% / 30% grid */}
            <div className="fus-meta-row-1">
              <span className="fus-badge fus-badge-subject" title="Subject Code">{data.subjectCode}</span>
              <span className="fus-badge fus-badge-type" title="Term &amp; Exam Type">{termExamType}</span>
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
          </>
        )}
      </div>

      {/* Divider */}
      <div className="fus-divider" />

      {/* Right Panel Actions */}
      <div className="fus-right-panel">
        <div className="fus-action-stack">
          {/* View Questions — active when questions are loaded */}
          <button
            type="button"
            className={hasQuestions ? 'fus-btn-view-active' : 'fus-btn-placeholder-view'}
            disabled={!hasQuestions}
            title={hasQuestions ? 'View exam questions' : 'Fetch or load an exam first'}
            onClick={onView}
          >
            <EyeIcon size={13} />
            View Questions
          </button>

          <div className="fus-action-row">
            <button type="button" className="fus-btn-sec" onClick={onFetch}>
              <RefreshIcon size={13} />
              Fetch
            </button>
            <button type="button" className="fus-btn-sec" onClick={onSave}>
              <SaveIcon size={13} />
              Save
            </button>
          </div>

          <button type="button" className="fus-btn-primary" onClick={onDownload}>
            <DownloadIcon size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

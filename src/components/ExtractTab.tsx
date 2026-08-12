import React, { useState, useEffect } from 'react';
import { ExamDataset, StatusState, ExtractMode, BatchState } from '../types';
import { RefreshIcon, SaveIcon, DownloadIcon, EyeIcon } from './Icons';
import { MetaSkeleton } from './Skeleton';
import { batchFetchManager } from '../utils/batchFetcher';

import { downloadPdfAsset, downloadZipAsset } from '../utils/exporter';

interface ExtractTabProps {
  dataset: ExamDataset | null;
  status?: StatusState;
  isExporting?: boolean;
  onFetch: () => void;
  onSave: () => void;
  onDownload: () => void;
  onView: () => void;
  onViewPreviewDataset: (ds: ExamDataset) => void;
  onCloseViewer: () => void;
}

export const ExtractTab: React.FC<ExtractTabProps> = ({
  dataset,
  status,
  isExporting,
  onFetch,
  onSave,
  onDownload,
  onView,
  onViewPreviewDataset,
  onCloseViewer
}) => {
  const [extractMode, setExtractMode] = useState<ExtractMode>('single');
  const [batchState, setBatchState] = useState<BatchState>(batchFetchManager.getState());

  useEffect(() => {
    const unsubscribe = batchFetchManager.subscribe((s) => setBatchState(s));
    return () => unsubscribe();
  }, []);

  const data: ExamDataset = dataset || {
    id: 'unknown',
    subjectCode: 'EXAM',
    subjectName: 'No active exam page detected',
    author: 'XAVALO',
    campus: 'XAVALO',
    term: 'SP26',
    termCode: 'SP26',
    examType: 'FE',
    examCategory: 'FE',
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
  const isExportActive = status === 'processing' || status === 'downloading' || !!isExporting;
  const isPe = data.examCategory === 'PE';
  const hasQuestions = !!(dataset && dataset.questions && dataset.questions.length > 0);

  const activePreviewDataset = batchState.previewDatasets[batchState.previewIndex] || null;

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
              <span className="fus-q-count" title="Question Count">
                {isPe ? 'PE Exam Assets' : `${data.totalQuestions} Questions`}
              </span>
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
          {/* Segmented Control Switch: Single | Batch */}
          <div className="fus-segmented-control" style={{ marginBottom: '4px' }}>
            <button
              type="button"
              className={`fus-radio-item ${extractMode === 'single' ? 'active' : ''}`}
              onClick={() => setExtractMode('single')}
            >
              Single
            </button>
            <button
              type="button"
              className={`fus-radio-item ${extractMode === 'batch' ? 'active' : ''}`}
              onClick={() => setExtractMode('batch')}
            >
              Batch
            </button>
          </div>

          {extractMode === 'single' ? (
            /* Single Tab Action Stack */
            <>
              {isPe ? (
                /* PE Asset Action Stack */
                <>
                  <button
                    type="button"
                    className="fus-btn-view-active"
                    onClick={onView}
                    title="View embedded PDF paper"
                  >
                    <EyeIcon size={13} />
                    View PDF
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

                  <button
                    type="button"
                    className="fus-btn-primary"
                    disabled={isExportActive}
                    style={isExportActive ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}
                    onClick={onDownload}
                  >
                    <DownloadIcon size={14} />
                    {isExportActive ? 'Exporting...' : 'Download'}
                  </button>
                </>
              ) : (
                /* Standard FE Action Stack */
                <>
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

                  <button
                    type="button"
                    className="fus-btn-primary"
                    disabled={isExportActive}
                    style={isExportActive ? { opacity: 0.65, cursor: 'not-allowed' } : undefined}
                    onClick={onDownload}
                  >
                    <DownloadIcon size={14} />
                    {isExportActive ? 'Exporting...' : 'Download'}
                  </button>
                </>
              )}
            </>
          ) : (
            /* Batch Tab Action Stack */
            <div className="fus-batch-stack">
              {/* Status | Progressbar pill */}
              <div className="fus-batch-status-bar">
                <span style={{ fontWeight: 700 }}>{batchState.status.toUpperCase()}</span>
                <div className="fus-batch-progress-pill">
                  <div
                    className="fus-batch-progress-fill"
                    style={{
                      width: `${batchState.totalDiscovered > 0 ? (batchState.completedCount / batchState.totalDiscovered) * 100 : 0}%`
                    }}
                  />
                </div>
                <span>{batchState.completedCount}/{batchState.totalDiscovered}</span>
              </div>

              {/* Start/Stop | Pause/Resume */}
              <div className="fus-batch-controls-row">
                {batchState.status === 'idle' || batchState.status === 'completed' || batchState.status === 'cancelled' || batchState.status === 'error' ? (
                  <button
                    type="button"
                    className="fus-btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => batchFetchManager.start()}
                  >
                    Start Batch
                  </button>
                ) : (
                  <button
                    type="button"
                    className="fus-btn-sec"
                    style={{ flex: 1, color: 'var(--fus-rose)' }}
                    onClick={() => batchFetchManager.stop()}
                  >
                    Stop
                  </button>
                )}

                {/* Pause / Resume Button: HIDDEN in Standby & Preview; VISIBLE ONLY during actual full batch fetch for ALL */}
                {(batchState.status === 'batch_fetching' || batchState.status === 'paused') && (
                  <button
                    type="button"
                    className="fus-btn-sec"
                    style={{ flex: 1 }}
                    onClick={() => batchFetchManager.togglePause()}
                  >
                    {batchState.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                )}
              </div>

              {/* Preview config controls: [ ] Preview examsets | Stepper */}
              <div className="fus-batch-stepper-container">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="fus-checkbox"
                    checked={batchState.isPreviewEnabled}
                    disabled={batchState.status !== 'idle' && batchState.status !== 'completed' && batchState.status !== 'cancelled'}
                    onChange={(e) => batchFetchManager.setPreviewConfig(e.target.checked, batchState.previewCount)}
                  />
                  <span>Preview examsets</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="fus-stepper-btn"
                    disabled={!batchState.isPreviewEnabled || batchState.previewCount <= 1 || (batchState.status !== 'idle' && batchState.status !== 'completed' && batchState.status !== 'cancelled')}
                    onClick={() => batchFetchManager.setPreviewConfig(batchState.isPreviewEnabled, batchState.previewCount - 1)}
                  >
                    -
                  </button>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{batchState.previewCount}</span>
                  <button
                    type="button"
                    className="fus-stepper-btn"
                    disabled={!batchState.isPreviewEnabled || batchState.previewCount >= 10 || (batchState.status !== 'idle' && batchState.status !== 'completed' && batchState.status !== 'cancelled')}
                    onClick={() => batchFetchManager.setPreviewConfig(batchState.isPreviewEnabled, batchState.previewCount + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hidden Preview Controls: Visible ONLY during preview_paused status */}
              {batchState.status === 'preview_paused' && (
                <div className="fus-batch-preview-box">
                  <div className="fus-preview-title-row">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={activePreviewDataset?.title}>
                      {activePreviewDataset ? (activePreviewDataset.title || activePreviewDataset.parsedTitle || activePreviewDataset.subjectCode) : 'Preview'}
                    </span>
                    <span>Examset {batchState.previewIndex + 1}/{batchState.previewDatasets.length}</span>
                  </div>

                  <button
                    type="button"
                    className="fus-btn-view-active"
                    style={{ padding: '3px 6px', fontSize: '11px', margin: '2px 0' }}
                    onClick={() => activePreviewDataset && onViewPreviewDataset(activePreviewDataset)}
                  >
                    <EyeIcon size={12} /> View Questions
                  </button>

                  <div className="fus-preview-nav-row">
                    <button
                      type="button"
                      className="fus-btn-sec fus-btn-preview-nav"
                      disabled={batchState.previewIndex <= 0}
                      onClick={() => batchFetchManager.setPreviewIndex(batchState.previewIndex - 1)}
                      title="Previous examset"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="fus-btn-sec fus-btn-preview-nav"
                      disabled={batchState.previewIndex >= batchState.previewDatasets.length - 1}
                      onClick={() => batchFetchManager.setPreviewIndex(batchState.previewIndex + 1)}
                      title="Next examset"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      className="fus-btn-sec fus-btn-preview-nav"
                      style={{ color: 'var(--fus-rose)' }}
                      onClick={() => batchFetchManager.cancelPreview()}
                      title="Cancel batch"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="fus-btn-primary fus-btn-preview-nav"
                      onClick={() => {
                        onCloseViewer();
                        batchFetchManager.proceedFromPreview();
                      }}
                      title="Proceed batch"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              {/* Log textbox */}
              <textarea
                className="fus-batch-log-box"
                readOnly
                value={batchState.logs.join('\n')}
                ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
                placeholder="Batch operation logs..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

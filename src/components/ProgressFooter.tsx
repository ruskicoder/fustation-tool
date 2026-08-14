import React from 'react';
import { BatchProgressState } from '../types';
import { ChevronUpIcon, PauseIcon, PlayIcon, XMarkIcon } from './Icons';

interface ProgressFooterProps {
  progress: BatchProgressState;
  onTogglePause: () => void;
  onCancel: () => void;
  onToggleDrawer: () => void;
  onCloseFooter?: () => void;
  isVisible: boolean;
}

export const ProgressFooter: React.FC<ProgressFooterProps> = ({
  progress,
  onTogglePause,
  onCancel,
  onToggleDrawer,
  onCloseFooter,
  isVisible
}) => {
  const {
    totalItems,
    completedItems,
    currentBatchIndex,
    totalBatches,
    batchStatus,
    currentExamCode,
    currentLogNote,
    isPaused,
    isDrawerExpanded,
    logs
  } = progress;

  // Footer is visible if explicitly requested, or if actively processing, or if drawer is expanded
  const isActivelyProcessing = ['compiling', 'retrying', 'downloading'].includes(batchStatus);
  const shouldShowFooter = isVisible || isDrawerExpanded || isActivelyProcessing;

  if (!shouldShowFooter && batchStatus === 'standby') {
    return null;
  }

  // Status pill styling mapping
  const statusPillMap: Record<string, { label: string; className: string }> = {
    standby: { label: 'Standby', className: 'fus-status-ready' },
    compiling: { label: 'Compiling', className: 'fus-status-processing' },
    retrying: { label: 'Retrying', className: 'fus-status-fetching' },
    failed: { label: 'Failed', className: 'fus-status-error' },
    downloading: { label: 'Downloading', className: 'fus-status-downloading' },
    done: { label: 'Done', className: 'fus-status-extracted' }
  };

  const statusCfg = statusPillMap[batchStatus] || statusPillMap.standby;

  return (
    <>
      {/* Expandable Log Drawer — Positioned ALWAYS ABOVE the footer bar */}
      {isDrawerExpanded && (
        <div
          className="fus-footer-log-drawer"
          role="region"
          aria-label="Export Progress Log Drawer"
        >
          <div className="fus-log-drawer-header">
            <span className="fus-log-drawer-title">Batch Progress Logs</span>
            <span className="fus-log-drawer-count">{logs.length} entries</span>
          </div>
          <div className="fus-log-drawer-body">
            {logs.length === 0 ? (
              <div className="fus-log-drawer-empty">Initializing batch progress execution...</div>
            ) : (
              logs.map((logStr, i) => (
                <div key={i} className="fus-log-drawer-item">
                  {logStr}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Slide-Up Footer Bar — Statically anchored to panel bottom */}
      <div className={`fus-progress-footer ${shouldShowFooter ? 'fus-footer-visible' : 'fus-footer-hidden'}`}>
        {/* Left Cluster: [Counter/Total] + [Batch X/Y] + [Status Pill] */}
        <div className="fus-footer-left">
          <span className="fus-footer-counter" title="Completed items / Total selected">
            [{completedItems} / {totalItems}]
          </span>
          <span className="fus-footer-batch-tag" title="Current Batch Volume / Total Volumes">
            Batch {Math.min(currentBatchIndex + 1, totalBatches || 1)}/{totalBatches || 1}
          </span>
          <div className={`fus-status-pill fus-footer-pill ${statusCfg.className}`}>
            <div className="fus-status-dot" />
            <span>{statusCfg.label}</span>
          </div>
        </div>

        {/* Middle Cluster: Inline log note + Center Arrow Expand button */}
        <div className="fus-footer-middle">
          <button
            type="button"
            className={`fus-footer-expand-btn ${isDrawerExpanded ? 'expanded' : ''}`}
            onClick={onToggleDrawer}
            title={isDrawerExpanded ? 'Collapse Log Drawer' : 'Expand Log Drawer'}
            aria-label="Toggle log drawer"
          >
            <ChevronUpIcon size={13} />
          </button>
          <span className="fus-footer-note" title={currentLogNote || currentExamCode}>
            {currentExamCode ? `[${currentExamCode}] ` : ''}
            {currentLogNote && currentExamCode && currentLogNote.startsWith(`[${currentExamCode}]`)
              ? currentLogNote.substring(`[${currentExamCode}]`.length).trim()
              : (currentLogNote || 'Processing batch export...')}
          </span>
        </div>

        {/* Right Cluster: Pause / Resume + Cancel / Close buttons */}
        <div className="fus-footer-right">
          {batchStatus === 'done' || batchStatus === 'failed' ? (
            <button
              type="button"
              className="fus-btn-sec fus-footer-btn fus-footer-btn-cancel"
              onClick={onCloseFooter || onCancel}
              title="Close Progress Bar"
            >
              <XMarkIcon size={12} />
              <span>Close</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="fus-btn-sec fus-footer-btn"
                onClick={onTogglePause}
                title={isPaused ? 'Resume Download' : 'Pause Download'}
              >
                {isPaused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                type="button"
                className="fus-btn-sec fus-footer-btn fus-footer-btn-cancel"
                onClick={onCancel}
                title="Cancel Download Operation"
              >
                <XMarkIcon size={12} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

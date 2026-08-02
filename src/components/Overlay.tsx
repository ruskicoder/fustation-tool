import React, { useState, useEffect } from 'react';
import { ExamDataset, ExportFormat, SavedExamsMap, StatusState } from '../types';
import { extractExamFromScripts, crawlExamFromDOM } from '../utils/parser';
import { exportExam } from '../utils/exporter';
import {
  saveExamToStorage,
  getSavedExamsFromStorage,
  clearAllExamsFromStorage,
  getActiveFormatFromStorage,
  setActiveFormatInStorage
} from '../utils/storage';
import { ExtractTab } from './ExtractTab';
import { SavedTab } from './SavedTab';

export const Overlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'extract' | 'saved'>('extract');
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('MD');
  const [currentDataset, setCurrentDataset] = useState<ExamDataset | null>(null);
  const [savedExams, setSavedExams] = useState<SavedExamsMap>({});
  const [status, setStatus] = useState<StatusState>('ready');
  const [progressLabel, setProgressLabel] = useState<string>('');

  useEffect(() => {
    // Load initial storage settings & auto extract
    getActiveFormatFromStorage((fmt) => {
      setActiveFormat(fmt || 'MD');
    });

    getSavedExamsFromStorage((exams) => {
      setSavedExams(exams || {});
    });

    const data = extractExamFromScripts();
    if (data && data.questions && data.questions.length > 1) {
      setCurrentDataset(data);
      setStatus('ready');
    }
  }, []);

  const handleFormatChange = (fmt: ExportFormat) => {
    setActiveFormat(fmt);
    setActiveFormatInStorage(fmt);
  };

  const handleFetch = async () => {
    setStatus('fetching');
    setProgressLabel('');

    // 1. Try raw script / HTML extraction
    const fastData = extractExamFromScripts();
    if (fastData && fastData.questions && fastData.questions.length > 1) {
      setCurrentDataset(fastData);
      setStatus('ready');
      return;
    }

    // 2. Automated DOM Crawler
    try {
      const crawled = await crawlExamFromDOM((curr, total) => {
        setProgressLabel(`(${curr}/${total})`);
      });

      if (crawled && crawled.questions && crawled.questions.length > 0) {
        setCurrentDataset(crawled);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error('[fustation-tool] DOM Crawler error:', e);
      setStatus('error');
    } finally {
      setProgressLabel('');
    }
  };

  const ensureDatasetLoaded = async (): Promise<ExamDataset | null> => {
    if (currentDataset && currentDataset.questions && currentDataset.questions.length > 1) {
      return currentDataset;
    }

    setStatus('fetching');
    const fastData = extractExamFromScripts();
    if (fastData && fastData.questions && fastData.questions.length > 1) {
      setCurrentDataset(fastData);
      return fastData;
    }

    try {
      const crawled = await crawlExamFromDOM((curr, total) => {
        setProgressLabel(`(${curr}/${total})`);
      });
      if (crawled && crawled.questions && crawled.questions.length > 0) {
        setCurrentDataset(crawled);
        return crawled;
      }
    } catch (e) {
      console.error('[fustation-tool] Crawl failed:', e);
    } finally {
      setProgressLabel('');
    }

    return null;
  };

  const handleSave = async () => {
    const dataToSave = await ensureDatasetLoaded();
    if (!dataToSave || !dataToSave.questions || dataToSave.questions.length === 0) {
      setStatus('error');
      return;
    }

    setStatus('processing');
    saveExamToStorage(dataToSave, (updatedList) => {
      setSavedExams(updatedList || savedExams);
      setStatus('extracted'); // Display Saved state
    });
  };

  const handleDownload = async () => {
    const dataToExport = await ensureDatasetLoaded();
    if (!dataToExport || !dataToExport.questions || dataToExport.questions.length === 0) {
      setStatus('error');
      return;
    }

    setStatus('processing');
    setTimeout(() => {
      saveExamToStorage(dataToExport, (updatedList) => {
        setSavedExams(updatedList || savedExams);
      });

      setStatus('downloading');
      exportExam(dataToExport, activeFormat);

      setTimeout(() => {
        setStatus('extracted');
      }, 600);
    }, 300);
  };

  const handleExportSavedItem = (examId: string) => {
    const item = savedExams[examId];
    if (item && item.dataset) {
      exportExam(item.dataset, activeFormat);
    }
  };

  const handleClearAll = () => {
    clearAllExamsFromStorage(() => {
      setSavedExams({});
    });
  };

  const savedCount = Object.keys(savedExams).length;

  const renderStatusPill = () => {
    const statusMap: Record<StatusState, { label: string; className: string }> = {
      ready: { label: 'Ready', className: 'fus-status-ready' },
      fetching: { label: `Fetching${progressLabel}...`, className: 'fus-status-fetching' },
      processing: { label: 'Processing...', className: 'fus-status-processing' },
      downloading: { label: 'Downloading...', className: 'fus-status-downloading' },
      extracted: { label: 'Saved / Ready', className: 'fus-status-extracted' },
      error: { label: 'Error', className: 'fus-status-error' }
    };

    const cfg = statusMap[status] || statusMap.ready;

    return (
      <div className={`fus-status-pill ${cfg.className}`} id="fus-status-pill">
        <div className="fus-status-dot" />
        <span>{cfg.label}</span>
      </div>
    );
  };

  return (
    <>
      {/* FAB Button */}
      <div className="fus-fab-container">
        <button
          type="button"
          className="fus-fab"
          aria-label="Toggle fustation-tool overlay"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          {savedCount > 0 && <div className="fus-fab-badge">{savedCount}</div>}
        </button>
      </div>

      {/* Expanded Panel (LOCKED 2:1 ASPECT RATIO) */}
      {isExpanded && (
        <div className="fus-panel">
          <div className="fus-accent-hairline" />

          {/* Header */}
          <div className="fus-header">
            <div className="fus-brand">
              <div className="fus-logo">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="fus-title-group">
                <span className="fus-title">fustation-tool</span>
                <span className="fus-subtitle">v1.0.0</span>
              </div>
            </div>

            <div className="fus-tabs">
              <button
                type="button"
                className={`fus-tab-btn ${activeTab === 'extract' ? 'active' : ''}`}
                onClick={() => setActiveTab('extract')}
              >
                Extract
              </button>
              <button
                type="button"
                className={`fus-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                Saved ({savedCount})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {renderStatusPill()}
              <button
                type="button"
                className="fus-ctrl-btn"
                aria-label="Minimize"
                onClick={() => setIsExpanded(false)}
              >
                –
              </button>
              <button
                type="button"
                className="fus-ctrl-btn fus-close-btn"
                aria-label="Close"
                onClick={() => setIsExpanded(false)}
              >
                ×
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div id="fus-panel-body">
            {activeTab === 'extract' ? (
              <ExtractTab
                dataset={currentDataset}
                activeFormat={activeFormat}
                onFormatChange={handleFormatChange}
                onFetch={handleFetch}
                onSave={handleSave}
                onDownload={handleDownload}
              />
            ) : (
              <SavedTab
                savedExams={savedExams}
                activeFormat={activeFormat}
                onFormatChange={handleFormatChange}
                onClearAll={handleClearAll}
                onExportItem={handleExportSavedItem}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { ExamDataset, ExportFormat, SavedExamsMap, StatusState } from '../types';
import { extractExamFromScripts, crawlExamFromDOM, getExamIdFromUrl } from '../utils/parser';
import { exportExam } from '../utils/exporter';
import {
  saveExamToStorage,
  getSavedExamsFromStorage,
  deleteExamFromStorage,
  clearAllExamsFromStorage,
  getActiveFormatFromStorage,
  setActiveFormatInStorage
} from '../utils/storage';
import { ExtractTab } from './ExtractTab';
import { SavedTab } from './SavedTab';

function classifyRoute(pathname: string): 'exam' | 'catalog' | 'other' {
  if (/\/marketplace\/exam\//.test(pathname)) return 'exam';
  if (/\/home(\/|$)/.test(pathname) || /\/subject\//.test(pathname)) return 'catalog';
  return 'other';
}

export const Overlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'extract' | 'saved'>('extract');
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('MD');
  const [currentDataset, setCurrentDataset] = useState<ExamDataset | null>(null);
  const [savedExams, setSavedExams] = useState<SavedExamsMap>({});
  const [status, setStatus] = useState<StatusState>('ready');
  const [progressLabel, setProgressLabel] = useState<string>('');

  const runFetch = async () => {
    setStatus('fetching');
    setProgressLabel('');
    await new Promise((r) => setTimeout(r, 100)); // 100ms visual render buffer

    const targetId = getExamIdFromUrl();
    const fastData = extractExamFromScripts(targetId ?? undefined);
    if (fastData && fastData.questions && fastData.questions.length > 1) {
      setCurrentDataset(fastData);
      setStatus('ready');
      return;
    }

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

  useEffect(() => {
    // Load initial storage settings & auto extract on initial mount
    getActiveFormatFromStorage((fmt) => {
      setActiveFormat(fmt || 'MD');
    });

    getSavedExamsFromStorage((exams) => {
      setSavedExams(exams || {});
    });

    if (typeof window !== 'undefined' && classifyRoute(window.location.pathname) === 'exam') {
      runFetch();
    }
  }, []);

  // Background SPA Route Observer
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) return;

    const handleMessage = (msg: any) => {
      if (msg && msg.type === 'FUSTATION_URL_CHANGED' && msg.url) {
        try {
          const newPath = new URL(msg.url).pathname;
          const targetRoute = classifyRoute(newPath);

          if (targetRoute === 'catalog') {
            // Exiting exam page to catalog/subject route: Autosave & clear current dataset
            setCurrentDataset((prevDataset) => {
              if (prevDataset && prevDataset.questions && prevDataset.questions.length > 0) {
                setStatus('autosaving');
                saveExamToStorage(prevDataset, (updatedList) => {
                  setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
                  setStatus('ready');
                });
              } else {
                setStatus('ready');
              }
              return null; // Clear dataset to default placeholder
            });
          } else if (targetRoute === 'exam') {
            // Entering new exam page: Clear active dataset and auto-fetch for new URL
            setCurrentDataset(null);
            runFetch();
          }
        } catch (e) {
          console.error('[fustation-tool] Route listener error:', e);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [savedExams]);

  const handleFormatChange = (fmt: ExportFormat) => {
    setActiveFormat(fmt);
    setActiveFormatInStorage(fmt);
  };

  const handleFetch = async () => {
    setCurrentDataset(null); // Clear active dataset in place
    await runFetch();
  };

  const ensureDatasetLoaded = async (): Promise<ExamDataset | null> => {
    if (currentDataset && currentDataset.questions && currentDataset.questions.length > 0) {
      return currentDataset;
    }

    setStatus('fetching');
    await new Promise((r) => setTimeout(r, 100));

    const targetId = getExamIdFromUrl();
    const fastData = extractExamFromScripts(targetId ?? undefined);
    if (fastData && fastData.questions && fastData.questions.length > 0) {
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
      setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
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
        setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
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

  const handleDeleteItem = (examId: string) => {
    deleteExamFromStorage(examId, (updatedList: SavedExamsMap) => {
      setSavedExams({ ...(updatedList || {}) });
    });
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
      autosaving: { label: 'Autosaving...', className: 'fus-status-autosaving' },
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
                onDeleteItem={handleDeleteItem}
                onExportItem={handleExportSavedItem}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

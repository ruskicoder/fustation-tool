import React, { useState, useEffect } from 'react';
import { ExamDataset, ExportFormat, SavedExamsMap, StatusState, ThemeName, THEME_ORDER, THEME_LABELS } from '../types';
import { extractExamFromScripts, crawlExamFromDOM, getExamIdFromUrl } from '../utils/parser';
import { exportExam } from '../utils/exporter';
import {
  saveExamToStorage,
  getSavedExamsFromStorage,
  deleteExamFromStorage,
  clearAllExamsFromStorage,
  getActiveFormatFromStorage,
  setActiveFormatInStorage,
  getPanelStateFromStorage,
  setPanelStateInStorage,
  getPendingFetchFromStorage,
  setPendingFetchInStorage,
  getThemeFromStorage,
  setThemeInStorage
} from '../utils/storage';
import { usePanelGeometry } from '../hooks/usePanelGeometry';
import { useToasts } from '../hooks/useToasts';
import { ExtractTab } from './ExtractTab';
import { SavedTab } from './SavedTab';
import { FormatSwitcher } from './FormatSwitcher';
import { ResizeHandles } from './ResizeHandles';
import { ToastHost } from './ToastHost';
import { BoltIcon, MinimizeIcon, PaletteIcon } from './Icons';

function classifyRoute(pathname: string): 'exam' | 'catalog' | 'other' {
  if (/\/marketplace\/exam\//.test(pathname)) return 'exam';
  if (/\/home(\/|$)/.test(pathname) || /\/subject\//.test(pathname)) return 'catalog';
  return 'other';
}

export const Overlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'extract' | 'saved'>('extract');
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('MD');
  const [theme, setTheme] = useState<ThemeName>('glass-dark');
  const [currentDataset, setCurrentDataset] = useState<ExamDataset | null>(null);
  const [savedExams, setSavedExams] = useState<SavedExamsMap>({});
  const [status, setStatus] = useState<StatusState>('ready');
  const [progressLabel, setProgressLabel] = useState<string>('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { geometry, hydrated, isDragging, isResizing, startDrag, startResize } = usePanelGeometry(isExpanded);
  const { toasts, push, dismiss } = useToasts();

  const runFetch = async (isManual = false) => {
    setStatus('fetching');
    setProgressLabel('');
    await new Promise((r) => setTimeout(r, 100)); // 100ms visual render buffer

    const targetId = getExamIdFromUrl();
    const fastData = extractExamFromScripts(targetId ?? undefined);

    if (fastData && fastData.questions && fastData.questions.length > 0) {
      setCurrentDataset(fastData);
      setStatus('ready');
      push(`Extracted ${fastData.questions.length} questions`, 'success');
      return;
    }

    // If manual fetch triggered and fastData is missing/empty, reload page to re-hydrate RSC script tags
    if (isManual) {
      console.warn('[fustation-tool] Script payload missing on manual fetch. Setting pending fetch & reloading page...');
      push('Re-hydrating scripts...', 'info');
      setPendingFetchInStorage(true, () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      });
      return;
    }

    // Fallback for auto-fetch: try DOM crawl
    try {
      const crawled = await crawlExamFromDOM((curr, total) => {
        setProgressLabel(`(${curr}/${total})`);
      });

      if (crawled && crawled.questions && crawled.questions.length > 0) {
        setCurrentDataset(crawled);
        setStatus('ready');
        push(`Crawled ${crawled.questions.length} questions`, 'success');
      } else {
        setStatus('error');
        push('Failed to parse exam page', 'error');
      }
    } catch (e) {
      console.error('[fustation-tool] DOM Crawler error:', e);
      setStatus('error');
      push('DOM crawler error', 'error');
    } finally {
      setProgressLabel('');
    }
  };

  useEffect(() => {
    // Restore persistent panel state & active tab
    getPanelStateFromStorage(({ isExpanded: savedExpanded, activeTab: savedTab }) => {
      if (typeof savedExpanded === 'boolean') setIsExpanded(savedExpanded);
      if (savedTab) setActiveTab(savedTab);
    });

    // Hydrate theme
    getThemeFromStorage((t) => {
      setTheme(t);
    });

    // Load initial storage settings & auto extract on initial mount
    getActiveFormatFromStorage((fmt) => {
      setActiveFormat(fmt || 'MD');
    });

    getSavedExamsFromStorage((exams) => {
      setSavedExams(exams || {});
    });

    // Check for pending fetch intention post-reload
    getPendingFetchFromStorage((pending) => {
      if (pending) {
        setPendingFetchInStorage(false, () => {
          if (typeof window !== 'undefined' && classifyRoute(window.location.pathname) === 'exam') {
            runFetch();
          }
        });
      } else if (typeof window !== 'undefined' && classifyRoute(window.location.pathname) === 'exam') {
        runFetch();
      }
    });
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
                  push(`Autosaved dataset (${prevDataset.questions.length}Q)`, 'info');
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

  const handleThemeCycle = () => {
    const idx = THEME_ORDER.indexOf(theme);
    const nextTheme = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    setTheme(nextTheme);
    setThemeInStorage(nextTheme);
    push(`Theme: ${THEME_LABELS[nextTheme]}`, 'info');
  };

  const handleFormatChange = (fmt: ExportFormat) => {
    setActiveFormat(fmt);
    setActiveFormatInStorage(fmt);
    push(`Format: ${fmt}`, 'info');
  };

  const handleFetch = async () => {
    setCurrentDataset(null); // Clear active dataset in place
    await runFetch(true);    // Execute manual fetch flow (script parse -> reload fallback)
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
      setStatus('ready');
      return fastData;
    }

    return null;
  };

  const handleSave = async () => {
    const dataToSave = await ensureDatasetLoaded();
    if (!dataToSave || !dataToSave.questions || dataToSave.questions.length === 0) {
      setStatus('error');
      push('No question data to save', 'error');
      return;
    }

    setStatus('processing');
    saveExamToStorage(dataToSave, (updatedList) => {
      setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
      setStatus('extracted'); // Display Saved state
      push('Exam saved to local cache', 'success');
    });
  };

  const handleDownload = async () => {
    const dataToExport = await ensureDatasetLoaded();
    if (!dataToExport || !dataToExport.questions || dataToExport.questions.length === 0) {
      setStatus('error');
      push('No question data to export', 'error');
      return;
    }

    setStatus('processing');
    setTimeout(() => {
      saveExamToStorage(dataToExport, (updatedList) => {
        setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
      });

      setStatus('downloading');
      exportExam(dataToExport, activeFormat);
      push(`Exported ${dataToExport.subjectCode} in ${activeFormat}`, 'info');

      setTimeout(() => {
        setStatus('extracted');
      }, 600);
    }, 300);
  };

  const handleToggleSelect = (examId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) {
        next.delete(examId);
      } else {
        next.add(examId);
      }
      return next;
    });
  };

  const handleToggleFolder = (subjectCode: string, folderExamIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isAllInFolderSelected = folderExamIds.every((id) => next.has(id));
      if (isAllInFolderSelected) {
        folderExamIds.forEach((id) => next.delete(id));
      } else {
        folderExamIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAll = (allFilteredIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => next.has(id));
      if (isAllSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    let remainingMap = { ...savedExams };

    idsToDelete.forEach((id) => {
      deleteExamFromStorage(id, (updatedMap) => {
        remainingMap = updatedMap || {};
      });
    });

    setSavedExams(remainingMap);
    setSelectedIds(new Set());
    push(`Deleted ${idsToDelete.length} saved exams`, 'warn');
  };

  const handleBatchDownload = () => {
    if (selectedIds.size === 0) return;
    const idsToExport = Array.from(selectedIds);
    push(`Exporting ${idsToExport.length} exams in ${activeFormat}...`, 'info');
    idsToExport.forEach((id, index) => {
      const item = savedExams[id];
      if (item && item.dataset) {
        setTimeout(() => {
          exportExam(item.dataset, activeFormat);
        }, index * 200);
      }
    });
  };

  const handleDeleteFolder = (folderExamIds: string[]) => {
    let remainingMap = { ...savedExams };
    folderExamIds.forEach((id) => {
      deleteExamFromStorage(id, (updatedMap) => {
        remainingMap = updatedMap || {};
      });
    });
    setSavedExams(remainingMap);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      folderExamIds.forEach((id) => next.delete(id));
      return next;
    });
    push(`Deleted folder (${folderExamIds.length} items)`, 'warn');
  };

  const handleExportFolder = (folderExamIds: string[]) => {
    push(`Exporting folder (${folderExamIds.length} items)...`, 'info');
    folderExamIds.forEach((id, index) => {
      const item = savedExams[id];
      if (item && item.dataset) {
        setTimeout(() => {
          exportExam(item.dataset, activeFormat);
        }, index * 200);
      }
    });
  };

  const handleExportSavedItem = (examId: string) => {
    const item = savedExams[examId];
    if (item && item.dataset) {
      exportExam(item.dataset, activeFormat);
      push(`Exported ${item.title} in ${activeFormat}`, 'info');
    }
  };

  const handleDeleteItem = (examId: string) => {
    deleteExamFromStorage(examId, (updatedList: SavedExamsMap) => {
      setSavedExams({ ...(updatedList || {}) });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(examId);
        return next;
      });
      push('Deleted exam item', 'warn');
    });
  };

  const savedCount = Object.keys(savedExams).length;

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    setPanelStateInStorage({ isExpanded: nextState });
  };

  const handleMinimize = () => {
    setIsExpanded(false);
    setPanelStateInStorage({ isExpanded: false });
  };

  const handleTabSelect = (tab: 'extract' | 'saved') => {
    setActiveTab(tab);
    setPanelStateInStorage({ activeTab: tab });
  };

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
    <div id="fustation-tool-root" data-theme={theme}>
      {/* Toast Notification Queue Host */}
      <ToastHost toasts={toasts} onDismiss={dismiss} />

      {/* FAB Button */}
      <div className="fus-fab-container">
        <button
          type="button"
          className="fus-fab"
          aria-label="Toggle fustation-tool overlay"
          onClick={handleToggleExpand}
        >
          <BoltIcon size={19} />
          {savedCount > 0 && <div className="fus-fab-badge">{savedCount}</div>}
        </button>
      </div>

      {/* Expanded Drag & Resizable Panel */}
      {isExpanded && (
        <div
          className="fus-panel"
          data-dragging={isDragging ? 'true' : undefined}
          data-resizing={isResizing ? 'true' : undefined}
          style={{
            position: 'fixed',
            left: `${geometry.x}px`,
            top: `${geometry.y}px`,
            width: `${geometry.w}px`,
            height: `${geometry.h}px`,
            bottom: 'auto',
            right: 'auto'
          }}
        >
          <div className="fus-accent-hairline" />

          {/* 8-Way Resize Handles */}
          <ResizeHandles onStart={startResize} />

          {/* Header (Acts as Drag Bar) */}
          <div className="fus-header">
            <div
              className="fus-brand"
              onPointerDown={startDrag}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              title="Drag to move panel"
            >
              <div className="fus-logo">
                <BoltIcon size={12} />
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
                onClick={() => handleTabSelect('extract')}
              >
                Extract
              </button>
              <button
                type="button"
                className={`fus-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => handleTabSelect('saved')}
              >
                Saved ({savedCount})
              </button>
            </div>

            <div style={{ flexShrink: 0, width: '130px' }}>
              <FormatSwitcher currentFormat={activeFormat} onChange={handleFormatChange} className="fus-header-switcher" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {renderStatusPill()}
              
              {/* Theme Switcher Button */}
              <button
                type="button"
                className="fus-ctrl-btn"
                aria-label="Switch theme"
                title={`Theme: ${THEME_LABELS[theme]}`}
                onClick={handleThemeCycle}
              >
                <PaletteIcon size={13} />
              </button>

              <button
                type="button"
                className="fus-ctrl-btn"
                aria-label="Minimize"
                onClick={handleMinimize}
              >
                <MinimizeIcon size={13} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div id="fus-panel-body">
            {activeTab === 'extract' ? (
              <ExtractTab
                dataset={currentDataset}
                status={status}
                onFetch={handleFetch}
                onSave={handleSave}
                onDownload={handleDownload}
              />
            ) : (
              <SavedTab
                savedExams={savedExams}
                selectedIds={selectedIds}
                isLoading={!hydrated}
                onToggleSelect={handleToggleSelect}
                onToggleFolder={handleToggleFolder}
                onSelectAll={handleSelectAll}
                onBatchDelete={handleBatchDelete}
                onBatchDownload={handleBatchDownload}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onDeleteItem={handleDeleteItem}
                onExportItem={handleExportSavedItem}
                onExportFolder={handleExportFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

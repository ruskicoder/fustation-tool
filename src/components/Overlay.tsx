import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExamDataset, ExportFormat, SavedExamsMap, StatusState, ThemeName, THEME_ORDER, THEME_LABELS } from '../types';
import { extractExamFromScripts, getExamIdFromUrl } from '../utils/parser';
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
  setThemeInStorage,
  getViewerOpenFromStorage,
  setViewerOpenInStorage,
  getReloadAttemptedFromStorage,
  setReloadAttemptedInStorage,
  clearReloadAttemptedFromStorage
} from '../utils/storage';
import { usePanelGeometry } from '../hooks/usePanelGeometry';
import { useToasts } from '../hooks/useToasts';
import { ExtractTab } from './ExtractTab';
import { SavedTab } from './SavedTab';
import { FormatSwitcher } from './FormatSwitcher';
import { ResizeHandles } from './ResizeHandles';
import { ToastHost } from './ToastHost';
import { ViewerPanel } from './ViewerPanel';
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

  // Viewer panel state
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [viewerDataset, setViewerDataset] = useState<ExamDataset | null>(null);

  const { geometry, hydrated, isDragging, isResizing, startDrag, startResize } = usePanelGeometry(isExpanded, 'main');
  const { toasts, push, dismiss } = useToasts();

  // Stable ref to always-current runFetch — prevents stale closure in useEffect (ISSUE-45)
  const runFetchRef = useRef<(() => Promise<void>) | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Unified 4-phase RSC fetch pipeline (ISSUE-42, 43, 44)
  //
  // Phase 1 — Instant parse (0ms):   reads innerHTML immediately
  // Phase 2 — Polling retry (×10):   retries every 300ms up to 3s to catch
  //                                   streamed __next_f.push() chunks
  // Phase 3 — Single guarded reload: fires once per exam URL, then sets
  //                                   pendingFetch flag for post-reload run
  // Phase 4 — Surface error:         shown only if all three phases fail
  //
  // DOM crawl (crawlExamFromDOM) is NEVER called. It is deprecated.
  // ─────────────────────────────────────────────────────────────────────────
  const runFetch = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setStatus('fetching');
    setProgressLabel('');

    const targetId = getExamIdFromUrl();
    const currentUrl = window.location.pathname;

    // ── Phase 1: INSTANT PARSE (0ms delay) ──────────────────────────────
    // Highest priority. Reads document.documentElement.innerHTML right now.
    // Works even before React hydration, on cached pages, or fast CDN hits.
    const instantData = extractExamFromScripts(targetId ?? undefined);
    if (instantData && instantData.questions && instantData.questions.length > 0) {
      setCurrentDataset(instantData);
      setStatus('ready');
      push(`Extracted ${instantData.questions.length} questions`, 'success');
      clearReloadAttemptedFromStorage();
      return;
    }

    // ── Phase 2: POLLING RETRY LOOP (300ms × 10 = up to 3s) ────────────
    // Next.js RSC __next_f.push() chunks stream in progressively after
    // document_idle. Re-reading innerHTML on each tick catches late chunks.
    const POLL_INTERVAL_MS = 300;
    const POLL_MAX_RETRIES = 10;

    for (let attempt = 1; attempt <= POLL_MAX_RETRIES; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      setProgressLabel(`(${attempt}/${POLL_MAX_RETRIES})`);

      const polledData = extractExamFromScripts(targetId ?? undefined);
      if (polledData && polledData.questions && polledData.questions.length > 0) {
        setCurrentDataset(polledData);
        setStatus('ready');
        setProgressLabel('');
        push(`Extracted ${polledData.questions.length} questions`, 'success');
        clearReloadAttemptedFromStorage();
        return;
      }
    }

    setProgressLabel('');

    // ── Phase 3: SINGLE GUARDED RELOAD ──────────────────────────────────
    // URL-keyed flag prevents reload loops. SPA navigation to a new exam
    // URL auto-invalidates the guard (different pathname = false).
    getReloadAttemptedFromStorage(currentUrl, (alreadyAttempted) => {
      if (!alreadyAttempted) {
        console.warn('[fustation-tool] RSC payload not found after polling. Reloading once for:', currentUrl);
        push('Re-hydrating page...', 'info');
        setReloadAttemptedInStorage(currentUrl, () => {
          setPendingFetchInStorage(true, () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          });
        });
      } else {
        // ── Phase 4: SURFACE ERROR ─────────────────────────────────────
        // Instant parse + polling + reload all failed. Never fall into DOM crawl.
        console.error('[fustation-tool] All fetch phases failed for:', currentUrl);
        setStatus('error');
        push('Could not extract exam data. Try refreshing manually.', 'error');
      }
    });
  }, [push]);

  // Keep runFetchRef always pointing to the current runFetch closure (ISSUE-45)
  useEffect(() => {
    runFetchRef.current = runFetch;
  });

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

    // Restore viewer open state (but don't re-open without a dataset)
    getViewerOpenFromStorage((wasOpen) => {
      // Viewer open state is restored only if there's a dataset available;
      // we silently discard it on cold boot — dataset isn't persisted.
      if (!wasOpen) return;
      // Clear stale viewer open flag since dataset is not yet loaded
      setViewerOpenInStorage(false);
    });

    // Check for pending fetch intention post-reload.
    // Use runFetchRef.current() to always call the latest closure (ISSUE-45).
    getPendingFetchFromStorage((pending) => {
      if (pending) {
        setPendingFetchInStorage(false, () => {
          if (typeof window !== 'undefined' && classifyRoute(window.location.pathname) === 'exam') {
            runFetchRef.current?.();
          }
        });
      } else if (typeof window !== 'undefined' && classifyRoute(window.location.pathname) === 'exam') {
        runFetchRef.current?.();
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
            // Close viewer when navigating away
            setViewerOpen(false);
            setViewerDataset(null);
            setViewerOpenInStorage(false);
          } else if (targetRoute === 'exam') {
            // Entering new exam page: Clear active dataset and auto-fetch for new URL
            setCurrentDataset(null);
            setViewerOpen(false);
            setViewerDataset(null);
            // Use ref to ensure we always call the latest runFetch closure (ISSUE-45)
            runFetchRef.current?.();
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
    setCurrentDataset(null); // Clear active dataset
    await runFetch();        // Unified pipeline handles all cases
  };

  const ensureDatasetLoaded = async (): Promise<ExamDataset | null> => {
    if (currentDataset && currentDataset.questions && currentDataset.questions.length > 0) {
      return currentDataset;
    }
    // Instant parse one more time — covers edge cases where runFetch
    // hasn't fired yet but the RSC payload is already in the DOM.
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

  // ----------------------------------------------------------------
  // Viewer Panel handlers
  // ----------------------------------------------------------------
  const handleViewExam = (dataset: ExamDataset) => {
    setViewerDataset(dataset);
    setViewerOpen(true);
    setViewerOpenInStorage(true);
    push(`Viewing ${dataset.subjectCode} · ${dataset.questions.length}Q`, 'info');
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
    setViewerOpenInStorage(false);
  };

  const handleViewCurrentExam = async () => {
    const data = await ensureDatasetLoaded();
    if (!data || !data.questions || data.questions.length === 0) {
      push('No questions to view. Fetch first.', 'warn');
      return;
    }
    handleViewExam(data);
  };

  const handleViewSavedItem = (examId: string) => {
    const item = savedExams[examId];
    if (item && item.dataset) {
      handleViewExam(item.dataset);
    }
  };

  // ----------------------------------------------------------------
  // Selection handlers
  // ----------------------------------------------------------------
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

      {/* Main Panel — Expanded Drag & Resizable */}
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
                onView={handleViewCurrentExam}
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
                onViewItem={handleViewSavedItem}
              />
            )}
          </div>
        </div>
      )}

      {/* Viewer Panel — independent second floating panel */}
      {viewerOpen && viewerDataset && (
        <ViewerPanel
          dataset={viewerDataset}
          onClose={handleViewerClose}
          mainGeo={geometry}
        />
      )}
    </div>
  );
};

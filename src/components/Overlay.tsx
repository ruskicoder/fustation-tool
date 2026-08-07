import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExamDataset, ExportFormat, FEFormat, PEFormat, SavedExamsMap, StatusState, ThemeName, THEME_ORDER, THEME_LABELS } from '../types';
import { extractExamFromScripts, getExamIdFromUrl } from '../utils/parser';
import { exportExam, exportSinglePe, exportBulkAsZip } from '../utils/exporter';
import {
  saveExamToStorage,
  getSavedExamsFromStorage,
  deleteExamFromStorage,
  deleteExamsFromStorage,
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

export function isValidExtractedDataset(ds: ExamDataset | null): boolean {
  if (!ds) return false;
  if (ds.questions && ds.questions.length > 0) return true;
  if (ds.examCategory === 'PE' || ds.pdfUrl !== null || ds.zipUrl !== null || ds.totalQuestions === 0) return true;
  return false;
}

function getExtractSuccessMessage(ds: ExamDataset): string {
  if (ds.examCategory === 'PE' || ds.totalQuestions === 0) {
    return 'Extracted Practical Exam (PE) assets';
  }
  return `Extracted ${ds.questions?.length || 0} questions`;
}

function classifyRoute(pathname: string): 'exam' | 'catalog' | 'other' {
  if (/\/marketplace\/exam\//.test(pathname)) return 'exam';
  if (/\/home(\/|$)/.test(pathname) || /\/subject\//.test(pathname)) return 'catalog';
  return 'other';
}

export const Overlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'extract' | 'saved'>('extract');
  const [feFormat, setFeFormat] = useState<FEFormat>('MD');
  const [peFormat, setPeFormat] = useState<PEFormat>('PE_BOTH');
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
    if (isValidExtractedDataset(instantData)) {
      setCurrentDataset(instantData!);
      setStatus('ready');
      push(getExtractSuccessMessage(instantData!), 'success');
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
      if (isValidExtractedDataset(polledData)) {
        setCurrentDataset(polledData!);
        setStatus('ready');
        setProgressLabel('');
        push(getExtractSuccessMessage(polledData!), 'success');
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
      if (fmt === 'MD' || fmt === 'PDF' || fmt === 'JSON') {
        setFeFormat(fmt);
      }
    });

    getSavedExamsFromStorage((exams) => {
      setSavedExams(exams || {});
    });

    // Storage change listener to keep savedExams up-to-date during batch background saves
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.fustation_saved_exams) {
        setSavedExams(changes.fustation_saved_exams.newValue || {});
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

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

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
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



  const handleFetch = async () => {
    setCurrentDataset(null); // Clear active dataset
    await runFetch();        // Unified pipeline handles all cases
  };

  const ensureDatasetLoaded = async (): Promise<ExamDataset | null> => {
    if (isValidExtractedDataset(currentDataset)) {
      return currentDataset;
    }
    const targetId = getExamIdFromUrl();
    const fastData = extractExamFromScripts(targetId ?? undefined);
    if (isValidExtractedDataset(fastData)) {
      setCurrentDataset(fastData);
      setStatus('ready');
      return fastData;
    }
    return null;
  };

  const handleSave = async () => {
    const dataToSave = (await ensureDatasetLoaded()) || currentDataset;
    if (!dataToSave) {
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
    const dataToExport = (await ensureDatasetLoaded()) || currentDataset;
    if (!dataToExport) {
      setStatus('error');
      push('No dataset to export', 'error');
      return;
    }

    setStatus('processing');
    setTimeout(async () => {
      saveExamToStorage(dataToExport, (updatedList) => {
        setSavedExams((prev) => ({ ...(updatedList || prev || {}) }));
      });

      setStatus('downloading');
      if (dataToExport.examCategory === 'PE' || dataToExport.totalQuestions === 0) {
        await exportSinglePe(dataToExport, peFormat);
      } else {
        await exportExam(dataToExport, feFormat);
      }
      push(`Exported ${dataToExport.subjectCode}`, 'info');

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
    push(`Viewing ${dataset.subjectCode}${dataset.examCategory === 'PE' ? ' (PE)' : ` · ${dataset.questions.length}Q`}`, 'info');
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
    setViewerOpenInStorage(false);
  };

  const handleViewCurrentExam = async () => {
    const data = (await ensureDatasetLoaded()) || currentDataset;
    if (!data) {
      push('No exam loaded to view. Fetch first.', 'warn');
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
    deleteExamsFromStorage(idsToDelete, (updatedMap) => {
      setSavedExams(updatedMap || {});
      setSelectedIds(new Set());
      push(`Deleted ${idsToDelete.length} saved exams`, 'warn');
    });
  };

  const handleBatchDownload = async () => {
    const selectedItems = Array.from(selectedIds).map((id) => savedExams[id]).filter(Boolean);
    if (selectedItems.length === 0) return;

    setStatus('downloading');
    push(`Exporting ${selectedItems.length} exams...`, 'info');
    try {
      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        const ds = item.dataset || (item as any);
        if (ds.examCategory === 'PE' || ds.totalQuestions === 0) {
          await exportSinglePe(ds as ExamDataset, peFormat);
        } else {
          await exportExam(ds as ExamDataset, feFormat);
        }
      } else {
        await exportBulkAsZip(selectedItems, feFormat, peFormat);
      }
    } catch (e: any) {
      push(`Export failed: ${e.message}`, 'error');
    } finally {
      setStatus('ready');
    }
  };

  const handleDeleteFolder = (folderExamIds: string[]) => {
    if (!folderExamIds || folderExamIds.length === 0) return;
    deleteExamsFromStorage(folderExamIds, (updatedMap) => {
      setSavedExams(updatedMap || {});
      setSelectedIds((prev) => {
        const next = new Set(prev);
        folderExamIds.forEach((id) => next.delete(id));
        return next;
      });
      push(`Deleted subject folder (${folderExamIds.length} exams)`, 'warn');
    });
  };

  const handleExportItem = async (examId: string) => {
    const item = savedExams[examId];
    if (item && item.dataset) {
      try {
        let success = true;
        if (item.dataset.examCategory === 'PE' || item.dataset.totalQuestions === 0) {
          success = await exportSinglePe(item.dataset, peFormat);
        } else {
          await exportExam(item.dataset, feFormat);
        }

        if (success !== false) {
          push(`Exported ${item.dataset.subjectCode || 'exam'}`, 'info');
        } else {
          push(`Export failed: ${item.dataset.subjectCode || 'exam'} asset unavailable`, 'error');
        }
      } catch (err: any) {
        push(`Export error: ${err?.message || 'Download failed'}`, 'error');
      }
    }
  };

  const handleExportFolder = async (folderExamIds: string[]) => {
    const folderItems = folderExamIds.map((id) => savedExams[id]).filter(Boolean);
    if (folderItems.length === 0) return;
    setStatus('downloading');
    push(`Exporting folder (${folderItems.length} items)...`, 'info');
    try {
      await exportBulkAsZip(folderItems, feFormat, peFormat);
    } catch (e: any) {
      push(`Folder export failed: ${e.message}`, 'error');
    } finally {
      setStatus('ready');
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
      batch_fetching: { label: 'Batching...', className: 'fus-status-fetching' },
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

            {(() => {
              const selectedSavedItems = Object.values(savedExams).filter((rec) => {
                const id = rec.id || rec.dataset?.id;
                return selectedIds.has(id);
              });
              let peSelectedCount = 0;
              let feSelectedCount = 0;
              selectedSavedItems.forEach((rec) => {
                const typeStr = (rec.dataset?.examType || rec.examType || '').toUpperCase();
                const titleStr = (rec.dataset?.title || rec.title || '').toUpperCase();
                const isPeFallback = typeStr.includes('PE') || ['PE', 'PE1', 'PE2', 'B5PE'].includes(typeStr) || titleStr.includes('_PE_') || titleStr.includes('_PE') || titleStr.includes('PRACTICAL');
                const cat = rec.dataset?.examCategory || rec.examCategory || (isPeFallback ? 'PE' : 'FE');
                if (cat === 'PE') {
                  peSelectedCount++;
                } else {
                  feSelectedCount++;
                }
              });

              const isExtractPeMode = activeTab === 'extract' && (currentDataset?.examCategory === 'PE' || currentDataset?.examType?.toUpperCase().includes('PE'));
              const isSavedPeMode = activeTab === 'saved' && peSelectedCount > 0 && feSelectedCount === 0;
              const isSavedMixedMode = activeTab === 'saved' && peSelectedCount > 0 && feSelectedCount > 0;

              const isPEFormatHeader = isExtractPeMode || isSavedPeMode;
              const isZipAvailableHeader = activeTab === 'extract'
                ? !!currentDataset?.zipUrl
                : selectedSavedItems.length > 0
                  ? selectedSavedItems.some(it => !!(it.dataset?.zipUrl || it.zipUrl))
                  : true;

              return (
                <div style={{ flexShrink: 0, minWidth: isSavedMixedMode ? '140px' : '118px' }}>
                  <FormatSwitcher
                    feFormat={feFormat}
                    peFormat={peFormat}
                    onFeChange={setFeFormat}
                    onPeChange={setPeFormat}
                    isPEFormat={isPEFormatHeader}
                    isZipAvailable={isZipAvailableHeader}
                    isMixedMode={isSavedMixedMode}
                    className="fus-header-switcher"
                  />
                </div>
              );
            })()}

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
                onViewPreviewDataset={handleViewExam}
                onCloseViewer={handleViewerClose}
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
                onExportItem={handleExportItem}
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

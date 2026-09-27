import React, { useMemo, useRef, useState } from 'react';
import { ExamDataset, PanelGeometry, ThemeName } from '../types';
import { usePanelGeometry } from '../hooks/usePanelGeometry';
import { resolveCollision } from '../utils/panelCollision';
import { containsQuery } from '../utils/highlight';
import { setViewerGeometryInStorage } from '../utils/storage';
import { ResizeHandles } from './ResizeHandles';
import { ScrollspyRail } from './ScrollspyRail';
import { QuestionList } from './QuestionList';
import { ImageLightbox } from './ImageLightbox';
import { downloadPdfAsset, downloadZipAsset } from '../utils/exporter';
import {
  EyeIcon,
  MinimizeIcon,
  SearchIcon,
  ChevronIcon,
  ChevronLeftIcon,
  XIcon,
  DownloadIcon,
  InboxIcon
} from './Icons';

interface ViewerPanelProps {
  dataset: ExamDataset;
  onClose: () => void;
  mainGeo: PanelGeometry;
  onNotify?: (message: string, kind?: 'info' | 'error') => void;
}

/**
 * Exam View Panel — second independent floating panel.
 *
 * Features:
 * - Full 8-way drag + resize via usePanelGeometry('viewer')
 * - AABB collision resolution with the main panel on gesture end
 * - 20/80 split: ScrollspyRail (IntersectionObserver) | QuestionList
 * - Live keyword search across question text + option text
 * - Result counter with < / > navigation between matching cards
 * - Clickable image thumbnails → ImageLightbox (native <dialog>)
 * - All 4 themes via CSS custom properties inherited from #fustation-tool-root
 */
export const ViewerPanel: React.FC<ViewerPanelProps> = ({
  dataset,
  onClose,
  mainGeo,
  onNotify
}) => {
  const downloadPeAsset = async (fn: (ds: ExamDataset) => Promise<boolean>, label: string) => {
    if (!(await fn(dataset))) onNotify?.(`${label} unavailable for ${dataset.subjectCode || 'this exam'}`, 'error');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedPdfSearchQuery, setDebouncedPdfSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Debounce PDF iframe search fragment to prevent reloads on every keystroke
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPdfSearchQuery(searchQuery.trim());
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    geometry,
    isDragging,
    isResizing,
    startDrag,
    startResize,
    endSession
  } = usePanelGeometry(true, 'viewer');

  // ----------------------------------------------------------------
  // Collision resolution: called after every gesture end.
  // The viewer is the "moving" panel; main panel is "fixed".
  // ----------------------------------------------------------------
  const handleGestureEnd = () => {
    endSession((settledGeo) => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const resolved = resolveCollision(settledGeo, mainGeo, vw, vh);
      if (
        resolved.x !== settledGeo.x ||
        resolved.y !== settledGeo.y
      ) {
        setViewerGeometryInStorage(resolved);
      }
    });
  };

  // Wrap startDrag / startResize to route gesture end through handleGestureEnd.
  // The hook internally calls endSession on pointerup; we need to intercept it.
  // Strategy: pass the resolved geometry update after endSession settles via
  // the onSettled callback added to the hook.
  // Because usePanelGeometry's endSession already accepts an onSettled param,
  // we can trigger collision check by calling it in ViewerPanel's own
  // pointerup handler on the panel element.
  const panelRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------------------
  // Search: compute match indices
  // ----------------------------------------------------------------
  const matchIndices = useMemo<Set<number>>(() => {
    const q = searchQuery.trim();
    if (!q || !dataset.questions) return new Set();
    const result = new Set<number>();
    dataset.questions.forEach((question) => {
      const inText = containsQuery(question.text, q);
      const inOptions = question.options.some((opt) => containsQuery(opt.text, q));
      if (inText || inOptions) result.add(question.index);
    });
    return result;
  }, [searchQuery, dataset.questions]);

  const matchArray = useMemo(() => Array.from(matchIndices).sort((a, b) => a - b), [matchIndices]);
  const matchCount = matchArray.length;

  const scrollToQuestion = (questionIndex: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector(`#q-${questionIndex}`) as HTMLElement | null;
    if (target) {
      root.scrollTo({ top: target.offsetTop - 52, behavior: 'smooth' });
    }
  };

  const handlePrevMatch = () => {
    if (matchCount === 0) return;
    const nextIdx = (activeMatchIndex - 1 + matchCount) % matchCount;
    setActiveMatchIndex(nextIdx);
    scrollToQuestion(matchArray[nextIdx]);
  };

  const handleNextMatch = () => {
    if (matchCount === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchCount;
    setActiveMatchIndex(nextIdx);
    scrollToQuestion(matchArray[nextIdx]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveMatchIndex(0);
    // Jump to first match immediately
    if (e.target.value.trim() && matchArray.length > 0) {
      scrollToQuestion(matchArray[0]);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setDebouncedPdfSearchQuery(searchQuery.trim());
      handleNextMatch();
    }
  };

  // ----------------------------------------------------------------
  // Derived exam metadata for header
  // ----------------------------------------------------------------
  const displayCode = dataset.title || dataset.parsedTitle || dataset.subjectCode;
  const examCode = [displayCode, dataset.examType].filter(Boolean).join(' · ');
  const questionCount = dataset.questions?.length ?? 0;

  // Helper to extract 5-8 digit numeric product ID from dataset attributes
  const extractNumericProductId = (ds: ExamDataset): string | null => {
    if (!ds) return null;
    if (ds.id && /^\d+$/.test(ds.id)) return ds.id;
    if (ds.pdfUrl) {
      const m = ds.pdfUrl.match(/productId=(\d+)/i);
      if (m && m[1]) return m[1];
    }
    const titleMatch = (ds.title || ds.parsedTitle || '').match(/\d{5,8}$/);
    if (titleMatch && titleMatch[0]) return titleMatch[0];
    return null;
  };

  const pdfIframeUrl = useMemo(() => {
    let rawPdfUrl = dataset.pdfUrl;
    if (!rawPdfUrl) {
      const numId = extractNumericProductId(dataset);
      if (numId) {
        rawPdfUrl = `/api/exams/pdf?productId=${numId}`;
      }
    }
    if (!rawPdfUrl) return null;
    const baseUrl = rawPdfUrl.startsWith('http')
      ? rawPdfUrl
      : `https://www.fustation.net${rawPdfUrl.startsWith('/') ? '' : '/'}${rawPdfUrl}`;
    const queryFragment = debouncedPdfSearchQuery
      ? `#toolbar=1&search=${encodeURIComponent(debouncedPdfSearchQuery)}`
      : '#toolbar=1';
    return `${baseUrl}${queryFragment}`;
  }, [dataset, debouncedPdfSearchQuery]);

  return (
    <>
      {/* Viewer Panel */}
      <div
        ref={panelRef}
        className="fus-panel fus-viewer-panel"
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
        onPointerUp={handleGestureEnd}
      >
        <div className="fus-accent-hairline" />

        {/* 8-Way Resize Handles */}
        <ResizeHandles onStart={startResize} />

        {/* Viewer Header */}
        <div
          className="fus-viewer-header"
          onPointerDown={startDrag}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Exam Code Badge — drag area */}
          <div className="fus-viewer-brand" title="Drag to move panel">
            <EyeIcon size={12} />
            <span className="fus-badge fus-badge-subject fus-viewer-examcode" title={examCode}>
              {examCode}
            </span>
            <span className="fus-viewer-qcount">{dataset.examCategory === 'PE' ? 'PE' : `${questionCount}Q`}</span>
          </div>

          {/* Search Input */}
          <div
            className="fus-viewer-search-wrap"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <SearchIcon size={11} className="fus-search-icon" />
            <input
              type="text"
              className="fus-saved-search fus-viewer-search"
              placeholder={dataset.examCategory === 'PE' ? 'Find in PDF paper...' : 'Search questions & answers...'}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search exam content"
            />
          </div>

          {/* Result Navigation — visible only for FE matches */}
          {dataset.examCategory !== 'PE' && (
            <div
              className={`fus-viewer-result-nav${matchCount > 0 ? ' visible' : ''}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="fus-viewer-result-count">
                {matchCount > 0 ? `${activeMatchIndex + 1}/${matchCount}` : '0/0'}
              </span>
              <button
                type="button"
                className="fus-ctrl-btn"
                onClick={handlePrevMatch}
                disabled={matchCount === 0}
                aria-label="Previous match"
                title="Previous match"
              >
                <ChevronLeftIcon size={11} />
              </button>
              <button
                type="button"
                className="fus-ctrl-btn"
                onClick={handleNextMatch}
                disabled={matchCount === 0}
                aria-label="Next match"
                title="Next match"
              >
                <ChevronIcon size={11} />
              </button>
              {/* Clear search */}
              <button
                type="button"
                className="fus-ctrl-btn"
                onClick={() => { setSearchQuery(''); setActiveMatchIndex(0); }}
                aria-label="Clear search"
                title="Clear search"
              >
                <XIcon size={11} />
              </button>
            </div>
          )}

          {/* Close / Minimize */}
          <div
            style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="fus-ctrl-btn"
              aria-label="Close exam viewer"
              title="Close viewer"
              onClick={onClose}
            >
              <MinimizeIcon size={13} />
            </button>
          </div>
        </div>

        {/* Viewer Body: Full-height PDF iframe for PE vs 20/80 split for FE */}
        <div className={`fus-viewer-body ${(dataset.examCategory === 'PE' || questionCount === 0) ? 'pe-mode' : ''}`} style={{ overflow: 'hidden' }}>
          {dataset.examCategory === 'PE' || questionCount === 0 ? (
            <div style={{ gridColumn: '1 / -1', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {pdfIframeUrl ? (
                <iframe
                  src={pdfIframeUrl}
                  title={dataset.title || 'PE Exam PDF Viewer'}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#525659' }}
                />
              ) : (
                <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center', color: 'var(--fus-text-main)' }}>
                  <InboxIcon size={32} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Practical Exam (PE) Asset Set</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--fus-text-muted)', maxWidth: '360px' }}>
                    This exam set contains downloadable Practical Exam papers and Answer Key archives.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    {dataset.pdfUrl && (
                      <button
                        type="button"
                        className="fus-btn-primary"
                        onClick={() => downloadPeAsset(downloadPdfAsset, 'PDF exam paper')}
                      >
                        <DownloadIcon size={14} /> Download PDF Exam Paper
                      </button>
                    )}
                    {dataset.zipUrl && (
                      <button
                        type="button"
                        className="fus-btn-sec"
                        onClick={() => downloadPeAsset(downloadZipAsset, 'ZIP answer key')}
                      >
                        <DownloadIcon size={14} /> Download ZIP Answer Key
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Left: Scrollspy Nav */}
              <ScrollspyRail
                questions={dataset.questions ?? []}
                scrollRef={scrollRef}
                matchIndices={matchIndices}
              />

              {/* Right: Question List */}
              <QuestionList
                questions={dataset.questions ?? []}
                passages={dataset.passages}
                searchQuery={searchQuery}
                matchIndices={matchIndices}
                scrollRef={scrollRef}
                onImageClick={(url) => setLightboxUrl(url)}
              />
            </>
          )}
        </div>
      </div>

      {/* Image Lightbox — rendered at root level inside #fustation-tool-root */}
      <ImageLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </>
  );
};

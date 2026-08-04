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
import {
  EyeIcon,
  MinimizeIcon,
  SearchIcon,
  ChevronIcon,
  ChevronLeftIcon,
  XIcon
} from './Icons';

interface ViewerPanelProps {
  dataset: ExamDataset;
  onClose: () => void;
  mainGeo: PanelGeometry;
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
  mainGeo
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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
      handleNextMatch();
    }
  };

  // ----------------------------------------------------------------
  // Derived exam metadata for header
  // ----------------------------------------------------------------
  const examCode = [dataset.subjectCode, dataset.examType].filter(Boolean).join(' · ');
  const questionCount = dataset.questions?.length ?? 0;

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
            <span className="fus-badge fus-badge-subject fus-viewer-examcode">
              {examCode}
            </span>
            <span className="fus-viewer-qcount">{questionCount}Q</span>
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
              placeholder="Search questions &amp; answers..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search exam questions and answers"
            />
          </div>

          {/* Result Navigation — visible only when there are matches */}
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

        {/* Viewer Body: 20% scrollspy | 80% question list */}
        <div className="fus-viewer-body">
          {/* Left: Scrollspy Nav */}
          <ScrollspyRail
            questions={dataset.questions ?? []}
            scrollRef={scrollRef}
            matchIndices={matchIndices}
          />

          {/* Right: Question List */}
          <QuestionList
            questions={dataset.questions ?? []}
            searchQuery={searchQuery}
            matchIndices={matchIndices}
            scrollRef={scrollRef}
            onImageClick={(url) => setLightboxUrl(url)}
          />
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

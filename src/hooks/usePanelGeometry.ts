import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanelGeometry,
  PANEL_MIN_W,
  PANEL_MIN_H,
  PANEL_DEFAULT_W,
  PANEL_DEFAULT_H,
  VIEWER_MIN_W,
  VIEWER_MIN_H,
  VIEWER_DEFAULT_W,
  VIEWER_DEFAULT_H
} from '../types';
import {
  getGeometryFromStorage,
  setGeometryInStorage,
  getViewerGeometryFromStorage,
  setViewerGeometryInStorage
} from '../utils/storage';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export type PanelKey = 'main' | 'viewer';

interface DragSession {
  mode: 'move' | 'resize';
  handle?: ResizeHandle;
  pointerId: number;
  startX: number;
  startY: number;
  startGeo: PanelGeometry;
}

function viewport() {
  if (typeof window === 'undefined') return { w: 1280, h: 800 };
  return { w: window.innerWidth, h: window.innerHeight };
}

/** Default placement for the main panel: bottom-right, above FAB. */
function defaultMainGeometry(): PanelGeometry {
  const { w, h } = viewport();
  const width = Math.min(PANEL_DEFAULT_W, Math.max(PANEL_MIN_W, w - 48));
  const height = Math.min(PANEL_DEFAULT_H, Math.max(PANEL_MIN_H, h - 140));
  return {
    x: Math.max(12, w - width - 24),
    y: Math.max(12, h - height - 84),
    w: width,
    h: height
  };
}

/** Default placement for the viewer panel: upper-left area. */
function defaultViewerGeometry(): PanelGeometry {
  const { w, h } = viewport();
  const width = Math.min(VIEWER_DEFAULT_W, Math.max(VIEWER_MIN_W, w - 48));
  const height = Math.min(VIEWER_DEFAULT_H, Math.max(VIEWER_MIN_H, h - 80));
  return {
    x: 24,
    y: 24,
    w: width,
    h: height
  };
}

/** Keeps a panel fully on screen and at or above the minimum size. */
function clampGeometry(geo: PanelGeometry, minW: number, minH: number): PanelGeometry {
  const { w: vw, h: vh } = viewport();
  const width  = Math.max(minW, Math.min(geo.w, Math.max(minW, vw - 16)));
  const height = Math.max(minH, Math.min(geo.h, Math.max(minH, vh - 16)));
  return {
    w: width,
    h: height,
    x: Math.max(8, Math.min(geo.x, vw - width  - 8)),
    y: Math.max(8, Math.min(geo.y, vh - height - 8))
  };
}

/**
 * Pointer-driven drag + 8-way resize with persistence.
 * Supports both 'main' and 'viewer' panel keys, routing to the correct
 * chrome.storage slot and using the appropriate size constraints.
 *
 * Geometry is written to chrome.storage (debounced) only when a gesture ends.
 */
export function usePanelGeometry(enabled: boolean, panelKey: PanelKey = 'main') {
  const minW = panelKey === 'viewer' ? VIEWER_MIN_W : PANEL_MIN_W;
  const minH = panelKey === 'viewer' ? VIEWER_MIN_H : PANEL_MIN_H;
  const defaultGeo = panelKey === 'viewer' ? defaultViewerGeometry : defaultMainGeometry;

  const clamp = (geo: PanelGeometry) => clampGeometry(geo, minW, minH);

  const getStorage = panelKey === 'viewer' ? getViewerGeometryFromStorage : getGeometryFromStorage;
  const setStorage = panelKey === 'viewer' ? setViewerGeometryInStorage  : setGeometryInStorage;

  const [geometry, setGeometry] = useState<PanelGeometry>(() => defaultGeo());
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const sessionRef = useRef<DragSession | null>(null);
  const frameRef   = useRef<number | null>(null);
  const pendingRef = useRef<PanelGeometry | null>(null);

  // Hydrate persisted geometry once.
  useEffect(() => {
    getStorage((stored) => {
      if (stored) {
        setGeometry(clamp(stored));
      }
      setHydrated(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-clamp on viewport resize.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setGeometry((prev) => clamp(prev));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const next = pendingRef.current;
    if (next) {
      pendingRef.current = null;
      setGeometry(next);
    }
  }, []);

  const scheduleFrame = useCallback((next: PanelGeometry) => {
    pendingRef.current = next;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value) setGeometry(value);
    });
  }, []);

  const endSession = useCallback((onSettled?: (geo: PanelGeometry) => void) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    flush();
    setIsDragging(false);
    setIsResizing(false);
    if (session) {
      setGeometry((prev) => {
        const clamped = clamp(prev);
        setStorage(clamped);
        onSettled?.(clamped);
        return clamped;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flush]);

  // Global pointer listeners attached only while a gesture is active.
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMove = (e: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const base = session.startGeo;

      if (session.mode === 'move') {
        scheduleFrame(clamp({ ...base, x: base.x + dx, y: base.y + dy }));
        return;
      }

      const handle = session.handle || 'se';
      let { x, y, w, h } = base;

      if (handle.indexOf('e') !== -1) w = base.w + dx;
      if (handle.indexOf('s') !== -1) h = base.h + dy;
      if (handle.indexOf('w') !== -1) {
        w = base.w - dx;
        if (w < minW) w = minW;
        x = base.x + base.w - w;
      }
      if (handle.indexOf('n') !== -1) {
        h = base.h - dy;
        if (h < minH) h = minH;
        y = base.y + base.h - h;
      }

      scheduleFrame(clamp({ x, y, w, h }));
    };

    const onUp = (e: PointerEvent) => {
      const session = sessionRef.current;
      if (session && e.pointerId !== session.pointerId) return;
      endSession();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = prevUserSelect;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isResizing, scheduleFrame, endSession]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      sessionRef.current = {
        mode: 'move',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startGeo: geometry
      };
      setIsDragging(true);
    },
    [enabled, geometry]
  );

  const startResize = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      if (!enabled || e.button !== 0) return;
      e.stopPropagation();
      sessionRef.current = {
        mode: 'resize',
        handle,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startGeo: geometry
      };
      setIsResizing(true);
    },
    [enabled, geometry]
  );

  /** Keyboard nudge (WCAG 2.1 dragging alternative). */
  const nudge = useCallback(
    (dx: number, dy: number, mode: 'move' | 'resize' = 'move') => {
      setGeometry((prev) => {
        const next =
          mode === 'move'
            ? clamp({ ...prev, x: prev.x + dx, y: prev.y + dy })
            : clamp({ ...prev, w: prev.w + dx, h: prev.h + dy });
        setStorage(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    const next = defaultGeo();
    setGeometry(next);
    setStorage(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    geometry,
    setGeometry,
    hydrated,
    isDragging,
    isResizing,
    startDrag,
    startResize,
    endSession,
    nudge,
    reset
  };
}

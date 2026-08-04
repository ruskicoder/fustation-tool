import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanelGeometry,
  PANEL_MIN_W,
  PANEL_MIN_H,
  PANEL_DEFAULT_W,
  PANEL_DEFAULT_H
} from '../types';
import { getGeometryFromStorage, setGeometryInStorage } from '../utils/storage';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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

/** Default placement: bottom-right, just above the FAB. */
function defaultGeometry(): PanelGeometry {
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

/** Keeps the panel fully on screen and above the minimum size. */
function clampGeometry(geo: PanelGeometry): PanelGeometry {
  const { w: vw, h: vh } = viewport();
  const width = Math.max(PANEL_MIN_W, Math.min(geo.w, Math.max(PANEL_MIN_W, vw - 16)));
  const height = Math.max(PANEL_MIN_H, Math.min(geo.h, Math.max(PANEL_MIN_H, vh - 16)));
  return {
    w: width,
    h: height,
    x: Math.max(8, Math.min(geo.x, vw - width - 8)),
    y: Math.max(8, Math.min(geo.y, vh - height - 8))
  };
}

/**
 * Pointer-driven drag + 8-way resize with persistence.
 * Geometry is written to chrome.storage (debounced) only when a gesture ends.
 */
export function usePanelGeometry(enabled: boolean) {
  const [geometry, setGeometry] = useState<PanelGeometry>(() => defaultGeometry());
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const sessionRef = useRef<DragSession | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<PanelGeometry | null>(null);

  // Hydrate persisted geometry once.
  useEffect(() => {
    getGeometryFromStorage((stored) => {
      if (stored) {
        setGeometry(clampGeometry(stored));
      }
      setHydrated(true);
    });
  }, []);

  // Re-clamp whenever the viewport changes so the panel never strands off-screen.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setGeometry((prev) => clampGeometry(prev));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

  const schedule = useCallback((next: PanelGeometry) => {
    pendingRef.current = next;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value) setGeometry(value);
    });
  }, []);

  const endSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    flush();
    setIsDragging(false);
    setIsResizing(false);
    if (session) {
      // Persist the settled geometry.
      setGeometry((prev) => {
        const clamped = clampGeometry(prev);
        setGeometryInStorage(clamped);
        return clamped;
      });
    }
  }, [flush]);

  // Global pointer listeners are attached only while a gesture is active.
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMove = (e: PointerEvent) => {
      const session = sessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const base = session.startGeo;

      if (session.mode === 'move') {
        schedule(clampGeometry({ ...base, x: base.x + dx, y: base.y + dy }));
        return;
      }

      const handle = session.handle || 'se';
      let { x, y, w, h } = base;

      if (handle.indexOf('e') !== -1) w = base.w + dx;
      if (handle.indexOf('s') !== -1) h = base.h + dy;
      if (handle.indexOf('w') !== -1) {
        w = base.w - dx;
        // Keep the right edge pinned while the left edge moves.
        if (w < PANEL_MIN_W) w = PANEL_MIN_W;
        x = base.x + base.w - w;
      }
      if (handle.indexOf('n') !== -1) {
        h = base.h - dy;
        if (h < PANEL_MIN_H) h = PANEL_MIN_H;
        y = base.y + base.h - h;
      }

      schedule(clampGeometry({ x, y, w, h }));
    };

    const onUp = (e: PointerEvent) => {
      const session = sessionRef.current;
      if (session && e.pointerId !== session.pointerId) return;
      endSession();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // Suppress text selection on the host page during a gesture.
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isDragging, isResizing, schedule, endSession]);

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

  /** Keyboard-accessible nudging for move/resize (WCAG 2.1 dragging alternative). */
  const nudge = useCallback(
    (dx: number, dy: number, mode: 'move' | 'resize' = 'move') => {
      setGeometry((prev) => {
        const next =
          mode === 'move'
            ? clampGeometry({ ...prev, x: prev.x + dx, y: prev.y + dy })
            : clampGeometry({ ...prev, w: prev.w + dx, h: prev.h + dy });
        setGeometryInStorage(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    const next = defaultGeometry();
    setGeometry(next);
    setGeometryInStorage(next);
  }, []);

  return {
    geometry,
    hydrated,
    isDragging,
    isResizing,
    startDrag,
    startResize,
    nudge,
    reset
  };
}

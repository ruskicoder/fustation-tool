import React from 'react';
import { ResizeHandle } from '../hooks/usePanelGeometry';

interface ResizeHandlesProps {
  onStart: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

const HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const LABELS: Record<ResizeHandle, string> = {
  n: 'Resize from top edge',
  s: 'Resize from bottom edge',
  e: 'Resize from right edge',
  w: 'Resize from left edge',
  ne: 'Resize from top-right corner',
  nw: 'Resize from top-left corner',
  se: 'Resize from bottom-right corner',
  sw: 'Resize from bottom-left corner'
};

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onStart }) => (
  <>
    {HANDLES.map((handle) => (
      <div
        key={handle}
        className={`fus-resize fus-resize-${handle}`}
        role="separator"
        aria-label={LABELS[handle]}
        onPointerDown={(e) => onStart(e, handle)}
      />
    ))}
    <div className="fus-resize-grip" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <line x1="9" y1="3" x2="3" y2="9" />
        <line x1="9" y1="6.5" x2="6.5" y2="9" />
      </svg>
    </div>
  </>
);

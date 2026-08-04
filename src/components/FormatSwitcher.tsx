import React from 'react';
import { ExportFormat } from '../types';

interface FormatSwitcherProps {
  currentFormat: ExportFormat;
  onChange: (format: ExportFormat) => void;
  className?: string;
}

export const FormatSwitcher: React.FC<FormatSwitcherProps> = ({ currentFormat, onChange, className }) => {
  const formats: ExportFormat[] = ['MD', 'PDF', 'JSON'];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, fmt: ExportFormat) => {
    let targetFmt: ExportFormat | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextIdx = (formats.indexOf(fmt) + 1) % formats.length;
      targetFmt = formats[nextIdx];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prevIdx = (formats.indexOf(fmt) - 1 + formats.length) % formats.length;
      targetFmt = formats[prevIdx];
    }

    if (targetFmt) {
      e.preventDefault();
      onChange(targetFmt);
      const container = e.currentTarget.parentElement;
      if (container) {
        const nextBtn = container.querySelector<HTMLButtonElement>(`[data-value="${targetFmt}"]`);
        if (nextBtn) nextBtn.focus();
      }
    }
  };

  return (
    <div className={`fus-segmented-control ${className || ''}`} role="radiogroup" aria-label="Export Format Switcher">
      {formats.map((fmt) => {
        const isActive = fmt === currentFormat;
        return (
          <button
            key={fmt}
            type="button"
            className={`fus-radio-item ${isActive ? 'active' : ''}`}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            data-value={fmt}
            title={`Export as ${fmt}`}
            onClick={() => onChange(fmt)}
            onKeyDown={(e) => handleKeyDown(e, fmt)}
          >
            {fmt}
          </button>
        );
      })}
    </div>
  );
};

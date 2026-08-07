import React from 'react';
import { FEFormat, PEFormat } from '../types';

interface FormatSwitcherProps {
  feFormat?: FEFormat;
  peFormat?: PEFormat;
  onFeChange?: (fmt: FEFormat) => void;
  onPeChange?: (fmt: PEFormat) => void;
  isPEFormat?: boolean;
  isZipAvailable?: boolean;
  isMixedMode?: boolean;
  className?: string;
}

export const FormatSwitcher: React.FC<FormatSwitcherProps> = ({
  feFormat = 'MD',
  peFormat = 'PE_BOTH',
  onFeChange,
  onPeChange,
  isPEFormat = false,
  isZipAvailable = true,
  isMixedMode = false,
  className
}) => {
  const feFormats: { id: FEFormat; label: string }[] = [
    { id: 'MD', label: 'MD' },
    { id: 'PDF', label: 'PDF' },
    { id: 'JSON', label: 'JSON' }
  ];

  const peFormats: { id: PEFormat; label: string; requiresZip?: boolean }[] = [
    { id: 'PE_PDF', label: 'PDF' },
    { id: 'PE_ZIP', label: 'ZIP', requiresZip: true },
    { id: 'PE_BOTH', label: 'Both (ZIP)', requiresZip: true }
  ];

  if (isMixedMode) {
    return (
      <div className={`fus-format-matrix ${className || ''}`}>
        {/* Row 1: FE Formats */}
        <div className="fus-matrix-row">
          <span className="fus-matrix-tag fus-badge-type">FE</span>
          <div className="fus-segmented-control fus-matrix-control">
            {feFormats.map((fmt) => {
              const isActive = feFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  className={`fus-radio-item ${isActive ? 'active' : ''}`}
                  onClick={() => onFeChange && onFeChange(fmt.id)}
                  title={`Export FE items as ${fmt.label}`}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: PE Formats */}
        <div className="fus-matrix-row">
          <span className="fus-matrix-tag fus-badge-subject" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)' }}>PE</span>
          <div className="fus-segmented-control fus-matrix-control">
            {peFormats.map((fmt) => {
              const isActive = peFormat === fmt.id;
              const isDisabled = fmt.requiresZip && !isZipAvailable;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  className={`fus-radio-item ${isActive ? 'active' : ''}`}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onPeChange && onPeChange(fmt.id)}
                  title={isDisabled ? 'No ZIP solution available for this PE examset' : `Export PE items as ${fmt.label}`}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (isPEFormat) {
    return (
      <div className={`fus-segmented-control fus-header-switcher ${className || ''}`} role="radiogroup" aria-label="PE Format Switcher">
        {peFormats.map((fmt) => {
          const isActive = peFormat === fmt.id;
          const isDisabled = fmt.requiresZip && !isZipAvailable;
          return (
            <button
              key={fmt.id}
              type="button"
              className={`fus-radio-item ${isActive ? 'active' : ''}`}
              role="radio"
              aria-checked={isActive}
              disabled={isDisabled}
              data-value={fmt.id}
              title={isDisabled ? 'No ZIP solution available for this PE examset' : `Export as ${fmt.label}`}
              onClick={() => !isDisabled && onPeChange && onPeChange(fmt.id)}
            >
              {fmt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Single FE Format Switcher
  return (
    <div className={`fus-segmented-control fus-header-switcher ${className || ''}`} role="radiogroup" aria-label="FE Format Switcher">
      {feFormats.map((fmt) => {
        const isActive = feFormat === fmt.id;
        return (
          <button
            key={fmt.id}
            type="button"
            className={`fus-radio-item ${isActive ? 'active' : ''}`}
            role="radio"
            aria-checked={isActive}
            data-value={fmt.id}
            title={`Export as ${fmt.label}`}
            onClick={() => onFeChange && onFeChange(fmt.id)}
          >
            {fmt.label}
          </button>
        );
      })}
    </div>
  );
};

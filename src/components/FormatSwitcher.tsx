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
  disabled?: boolean;
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
  disabled = false,
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
    { id: 'PE_BOTH', label: 'ALL', requiresZip: true }
  ];

  if (isMixedMode) {
    return (
      <div className={`fus-format-matrix ${className || ''}`} role="region" aria-label="Format Matrix">
        {/* Row 1: FE Formats */}
        <div className="fus-matrix-grid-row" role="radiogroup" aria-label="FE format">
          <span className="fus-matrix-row-label">FE</span>
          {feFormats.map((fmt) => {
            const isActive = feFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                className={`fus-radio-item ${isActive ? 'active' : ''}`}
                role="radio"
                aria-checked={isActive}
                disabled={disabled}
                onClick={() => !disabled && onFeChange && onFeChange(fmt.id)}
                title={`Export FE items as ${fmt.label}`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: PE Formats */}
        <div className="fus-matrix-grid-row" role="radiogroup" aria-label="PE format">
          <span className="fus-matrix-row-label">PE</span>
          {peFormats.map((fmt) => {
            const isActive = peFormat === fmt.id;
            const isOptDisabled = disabled || (fmt.requiresZip && !isZipAvailable);
            return (
              <button
                key={fmt.id}
                type="button"
                className={`fus-radio-item ${isActive ? 'active' : ''}`}
                role="radio"
                aria-checked={isActive}
                disabled={isOptDisabled}
                onClick={() => !isOptDisabled && onPeChange && onPeChange(fmt.id)}
                title={isOptDisabled && !disabled ? 'No ZIP solution available for this PE examset' : `Export PE items as ${fmt.label}`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (isPEFormat) {
    return (
      <div className={`fus-segmented-control fus-header-switcher ${className || ''}`} role="radiogroup" aria-label="PE Format Switcher">
        {peFormats.map((fmt) => {
          const isActive = peFormat === fmt.id;
          const isOptDisabled = disabled || (fmt.requiresZip && !isZipAvailable);
          return (
            <button
              key={fmt.id}
              type="button"
              className={`fus-radio-item ${isActive ? 'active' : ''}`}
              role="radio"
              aria-checked={isActive}
              disabled={isOptDisabled}
              data-value={fmt.id}
              title={isOptDisabled && !disabled ? 'No ZIP solution available for this PE examset' : `Export as ${fmt.label}`}
              onClick={() => !isOptDisabled && onPeChange && onPeChange(fmt.id)}
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
            disabled={disabled}
            data-value={fmt.id}
            title={`Export as ${fmt.label}`}
            onClick={() => !disabled && onFeChange && onFeChange(fmt.id)}
          >
            {fmt.label}
          </button>
        );
      })}
    </div>
  );
};

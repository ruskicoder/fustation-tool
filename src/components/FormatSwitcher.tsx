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
  className,
}) => {
  const feFormats: { id: FEFormat; label: string }[] = [
    { id: 'MD', label: 'MD' },
    { id: 'PDF', label: 'PDF' },
    { id: 'JSON', label: 'JSON' },
  ];

  const peFormats: {
    id: PEFormat;
    label: string;
    requiresZip?: boolean;
  }[] = [
    { id: 'PE_PDF', label: 'PDF' },
    { id: 'PE_ZIP', label: 'ZIP', requiresZip: true },
    { id: 'PE_BOTH', label: 'Both', requiresZip: true },
  ];

  const stopDrag = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  if (isMixedMode) {
    return (
      <div
        className={`fus-format-matrix ${className || ''}`}
        role="group"
        aria-label="FE and PE format selection"
        onPointerDown={stopDrag}
      >
        <div
          className="fus-matrix-grid-row"
          role="radiogroup"
          aria-label="FE format"
        >
          <span className="fus-matrix-row-label" title="Front-End Exams">
            FE
          </span>

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
                title={`Export FE items as ${fmt.label}`}
                onPointerDown={stopDrag}
                onClick={() => onFeChange?.(fmt.id)}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>

        <div
          className="fus-matrix-grid-row"
          role="radiogroup"
          aria-label="PE format"
        >
          <span className="fus-matrix-row-label" title="Practical Exams">
            PE
          </span>

          {peFormats.map((fmt) => {
            const isActive = peFormat === fmt.id;
            const isDisabled = Boolean(
              fmt.requiresZip && !isZipAvailable,
            );

            return (
              <button
                key={fmt.id}
                type="button"
                className={`fus-radio-item ${isActive ? 'active' : ''}`}
                role="radio"
                aria-checked={isActive}
                disabled={isDisabled}
                data-value={fmt.id}
                title={
                  isDisabled
                    ? 'No ZIP solution available for this PE examset'
                    : `Export PE items as ${fmt.label}`
                }
                onPointerDown={stopDrag}
                onClick={() => {
                  if (!isDisabled) onPeChange?.(fmt.id);
                }}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const formats = isPEFormat ? peFormats : feFormats;
  const selectedFormat = isPEFormat ? peFormat : feFormat;

  return (
    <div
      className={`fus-segmented-control fus-header-switcher ${className || ''}`}
      role="radiogroup"
      aria-label={`${isPEFormat ? 'PE' : 'FE'} format`}
      onPointerDown={stopDrag}
    >
      {formats.map((fmt) => {
        const isActive = selectedFormat === fmt.id;
        const isDisabled =
          'requiresZip' in fmt &&
          Boolean(fmt.requiresZip && !isZipAvailable);

        return (
          <button
            key={fmt.id}
            type="button"
            className={`fus-radio-item ${isActive ? 'active' : ''}`}
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            data-value={fmt.id}
            title={
              isDisabled
                ? 'No ZIP solution available for this PE examset'
                : `Export as ${fmt.label}`
            }
            onPointerDown={stopDrag}
            onClick={() => {
              if (isDisabled) return;

              if (isPEFormat) {
                onPeChange?.(fmt.id as PEFormat);
              } else {
                onFeChange?.(fmt.id as FEFormat);
              }
            }}
          >
            {fmt.label}
          </button>
        );
      })}
    </div>
  );
};

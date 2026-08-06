import React, { useEffect } from 'react';
import { XIcon } from './Icons';
import { normalizeImageUrl } from '../utils/images';

interface ImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

/**
 * Full-resolution image preview modal.
 * Uses a pure React fixed backdrop container inside #fustation-tool-root to prevent
 * native <dialog> top-layer intrusion and lock event bubbling away from host page listeners.
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ url, onClose }) => {
  const normalizedUrl = normalizeImageUrl(url);

  useEffect(() => {
    if (!url) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [url, onClose]);

  if (!normalizedUrl) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fus-lightbox-backdrop"
      onClick={handleBackdropClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Image preview backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fus-lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="fus-lightbox-close fus-ctrl-btn"
          onClick={handleCloseButtonClick}
          aria-label="Close image preview"
        >
          <XIcon size={14} />
        </button>
        <img
          src={normalizedUrl}
          alt="Full resolution question image"
          className="fus-lightbox-img"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

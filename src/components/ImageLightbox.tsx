import React, { useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface ImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

/**
 * Full-resolution image preview using the native <dialog> element.
 * Native showModal() provides focus trapping + Escape-to-close automatically.
 * Backdrop click (clicking the <dialog> element itself, not its children) closes.
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ url, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Don't render the <dialog> element at all when there's no image to show.
  if (!url) return null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, [url]);

  // The native 'close' event fires on Escape key AND programmatic close().
  const handleDialogClose = () => {
    onClose();
  };

  // Clicking the <dialog> backdrop (the dialog element itself, not children)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fus-lightbox"
      aria-label="Image preview"
      aria-modal="true"
      onClose={handleDialogClose}
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className="fus-lightbox-close fus-ctrl-btn"
        onClick={onClose}
        aria-label="Close image preview"
      >
        <XIcon size={14} />
      </button>
      <img
        src={url}
        alt="Full resolution question image"
        className="fus-lightbox-img"
      />
    </dialog>
  );
};

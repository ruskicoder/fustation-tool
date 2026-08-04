import React from 'react';
import { ToastItem } from '../types';
import { CheckIcon, AlertIcon, InfoIcon } from './Icons';

interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const ICONS: Record<ToastItem['kind'], React.FC<{ size?: number }>> = {
  success: CheckIcon,
  error: AlertIcon,
  warn: AlertIcon,
  info: InfoIcon
};

export const ToastHost: React.FC<ToastHostProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fus-toast-host" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind] || InfoIcon;
        return (
          <button
            key={toast.id}
            type="button"
            className={`fus-toast fus-toast-${toast.kind}`}
            onClick={() => onDismiss(toast.id)}
            title="Dismiss"
          >
            <span className="fus-toast-icon">
              <Icon size={12} />
            </span>
            <span className="fus-toast-msg">{toast.message}</span>
          </button>
        );
      })}
    </div>
  );
};

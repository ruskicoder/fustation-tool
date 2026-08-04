import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false
});

export const BoltIcon: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.65" y1="16.65" x2="21" y2="21" />
  </svg>
);

export const ChevronIcon: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const MinimizeIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const GripIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <circle cx="9" cy="6" r="0.6" />
    <circle cx="15" cy="6" r="0.6" />
    <circle cx="9" cy="12" r="0.6" />
    <circle cx="15" cy="12" r="0.6" />
    <circle cx="9" cy="18" r="0.6" />
    <circle cx="15" cy="18" r="0.6" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const InboxIcon: React.FC<IconProps> = ({ size = 22, className }) => (
  <svg {...base(size)} className={className} strokeWidth={1.6}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="13.5" cy="6.5" r="1.2" />
    <circle cx="17.5" cy="10.5" r="1.2" />
    <circle cx="8.5" cy="7.5" r="1.2" />
    <circle cx="6.5" cy="12.5" r="1.2" />
    <path d="M12 2a10 10 0 1 0 0 20c.6 0 1-.4 1-1v-1.5a2 2 0 0 1 2-2h1.5a4 4 0 0 0 4-4A9.5 9.5 0 0 0 12 2z" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 13, className }) => (
  <svg {...base(size)} className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

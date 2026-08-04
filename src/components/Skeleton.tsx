import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 12, radius = 5, className }) => (
  <span
    className={`fus-skeleton ${className || ''}`}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  />
);

/** Shimmer stand-in for the Extract tab metadata column. */
export const MetaSkeleton: React.FC = () => (
  <div className="fus-meta-skeleton" aria-hidden="true">
    <div className="fus-meta-row-1">
      <Skeleton height={18} radius={5} />
      <Skeleton height={18} radius={5} />
      <Skeleton height={18} radius={5} />
    </div>
    <div className="fus-meta-row-2">
      <Skeleton height={13} />
      <Skeleton height={13} />
    </div>
    <Skeleton height={13} width="88%" />
    <Skeleton height={15} width="62%" />
  </div>
);

/** Shimmer stand-in for the Saved tab tree rows. */
export const SavedListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="fus-saved-skeleton" aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="fus-skeleton-row">
        <Skeleton width={14} height={14} radius={4} />
        <Skeleton width={54} height={16} radius={4} />
        <Skeleton height={12} width={`${55 + ((i * 13) % 30)}%`} />
      </div>
    ))}
  </div>
);

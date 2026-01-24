import * as React from 'react';

interface StatusBadgeProps {
  value: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component for column/row headers.
 * Shows label text and optional count.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  value,
  count,
  size = 'md',
}) => {
  return (
    <span className={`bv-status-badge bv-status-badge-${size}`}>
      <span className="bv-badge-label">{value}</span>
      {count !== undefined && <span className="bv-badge-count">{count}</span>}
    </span>
  );
};

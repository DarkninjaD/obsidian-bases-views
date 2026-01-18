import * as React from 'react';
import { getColorForValue } from '../utils/colorUtils';

interface StatusBadgeProps {
  value: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Colored badge component for status/category values.
 * Generates consistent colors based on value hash.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  value,
  count,
  size = 'md',
}) => {
  const colors = getColorForValue(value);

  return (
    <span
      className={`bv-status-badge bv-status-badge-${size}`}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {value}
      {count !== undefined && <span className="bv-badge-count">{count}</span>}
    </span>
  );
};

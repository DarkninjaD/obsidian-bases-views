import * as React from 'react';
import { StatusBadge } from './StatusBadge';

interface RowHeaderProps {
  title: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Collapsible row header for sub-groups in grid mode.
 * Shows triangle indicator, colored badge title, and count.
 */
export const RowHeader: React.FC<RowHeaderProps> = ({
  title,
  count,
  isCollapsed,
  onToggle,
}) => {
  return (
    <div className="bv-row-header" onClick={onToggle}>
      <span className={`bv-row-toggle ${isCollapsed ? 'bv-collapsed' : ''}`}>
        <svg
          viewBox="0 0 12 12"
          className="bv-toggle-icon"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 4.5 L6 7.5 L9 4.5" />
        </svg>
      </span>
      <StatusBadge value={title} size="sm" />
      <span className="bv-row-count">{count}</span>
    </div>
  );
};

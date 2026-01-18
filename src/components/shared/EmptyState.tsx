import React from 'react';

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

/**
 * Empty state component shown when there's no data to display.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No entries to display',
  icon = '📋',
}) => {
  return (
    <div className="bv-empty-state">
      <div className="bv-text-6xl bv-mb-4">{icon}</div>
      <p className="bv-text-lg bv-text-muted">{message}</p>
    </div>
  );
};

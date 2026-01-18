import * as React from 'react';

interface NewPageButtonProps {
  onClick: () => void;
  label?: string;
  compact?: boolean;
}

/**
 * Button for creating new entries in a cell or column.
 * Shows on hover or always when compact is false.
 */
export const NewPageButton: React.FC<NewPageButtonProps> = ({
  onClick,
  label = '+ New page',
  compact = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      className={`bv-new-page-btn ${compact ? 'bv-new-page-btn-compact' : ''}`}
      onClick={handleClick}
    >
      {compact ? '+' : label}
    </button>
  );
};

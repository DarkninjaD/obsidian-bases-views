import React from 'react';
import { differenceInDays } from 'date-fns';

interface GridProps {
  start: Date;
  end: Date;
  rowCount: number;
}

/**
 * Grid component providing background lines for Gantt chart.
 * Shows vertical day dividers and horizontal row dividers.
 */
export const Grid: React.FC<GridProps> = ({ start, end, rowCount }) => {
  const dayCount = differenceInDays(end, start) + 1;
  const columnWidth = `${100 / dayCount}%`;

  return (
    <div className="bv-gantt-grid">
      {/* Vertical day lines */}
      {Array.from({ length: dayCount }).map((_, index) => (
        <div
          key={`col-${index}`}
          className="bv-gantt-grid-column"
          style={{
            left: `${(index / dayCount) * 100}%`,
            width: columnWidth,
          }}
        />
      ))}

      {/* Horizontal row lines */}
      {Array.from({ length: rowCount }).map((_, index) => (
        <div
          key={`row-${index}`}
          className="bv-gantt-grid-row"
          style={{
            top: `${index * 40}px`,
            height: '40px',
          }}
        />
      ))}
    </div>
  );
};

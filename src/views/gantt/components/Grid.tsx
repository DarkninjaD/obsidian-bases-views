import * as React from 'react';
import { getTimelineUnitCount } from '../utils/dateCalculations';
import { GanttTimelineStep } from '../../../types/view-config';

interface GridProps {
  start: Date;
  end: Date;
  rowCount: number;
  step?: GanttTimelineStep;
}

/**
 * Grid component providing background lines for Gantt chart.
 * Shows vertical day/week/month dividers and horizontal row dividers.
 */
export const Grid: React.FC<GridProps> = ({ start, end, rowCount, step }) => {
  const unitCount = getTimelineUnitCount(start, end, step || 'day');
  const columnWidth = `${100 / unitCount}%`;

  return (
    <div className="bv-gantt-grid">
      {/* Vertical unit lines */}
      {Array.from({ length: unitCount }).map((_, index) => (
        <div
          key={`col-${index}`}
          className="bv-gantt-grid-column"
          style={{
            left: `${(index / unitCount) * 100}%`,
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

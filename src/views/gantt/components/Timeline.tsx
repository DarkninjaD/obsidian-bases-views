import * as React from 'react';
import { format } from 'date-fns';
import { generateTimelineMarkers } from '../utils/dateCalculations';
import { GanttTimelineStep } from '../../../types/view-config';

interface TimelineProps {
  start: Date;
  end: Date;
  step?: GanttTimelineStep;
}

/**
 * Timeline header component showing dates.
 * Displays day numbers with month boundaries highlighted.
 */
export const Timeline: React.FC<TimelineProps> = ({ start, end, step }) => {
  const markers = generateTimelineMarkers(start, end, step || 'day');
  const dayWidth = `${100 / markers.length}%`;

  return (
    <div className="bv-gantt-timeline">
      {markers.map((marker, index) => (
        <div
          key={index}
          className={`bv-gantt-timeline-day ${
            marker.isMonthStart ? 'bv-gantt-timeline-month-start' : ''
          }`}
          style={{ width: dayWidth }}
        >
          {marker.isMonthStart && (
            <div className="bv-gantt-timeline-month">
              {format(marker.date, 'MMM yyyy')}
            </div>
          )}
          <div className="bv-gantt-timeline-date">{marker.label}</div>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDroppable } from '@dnd-kit/core';
import { CalendarEvent } from '../../../types/view-config';
import { Event } from './Event';
import { formatDayNumber } from '../utils/dateUtils';
import { isDayInMonth, isDayToday } from '../utils/calendarHelpers';

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  app: App;
  hoverParent: HoverParent;
}

/**
 * DayCell component for Calendar view.
 * Represents a single day in the calendar grid with events.
 */
export const DayCell: React.FC<DayCellProps> = ({
  date,
  events,
  isCurrentMonth,
  app,
  hoverParent,
}) => {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const { setNodeRef, isOver } = useDroppable({
    id: dateString,
  });

  const isToday = isDayToday(date);

  return (
    <div
      ref={setNodeRef}
      className={`bv-calendar-day-cell ${
        !isCurrentMonth ? 'bv-calendar-day-other-month' : ''
      } ${isToday ? 'bv-calendar-day-today' : ''} ${
        isOver ? 'bv-calendar-day-drag-over' : ''
      }`}
    >
      <div className="bv-calendar-day-number">{formatDayNumber(date)}</div>

      <div className="bv-calendar-day-events">
        {events.map((event) => (
          <Event key={event.id} event={event} app={app} hoverParent={hoverParent} />
        ))}

        {events.length === 0 && isOver && (
          <div className="bv-calendar-day-drop-hint">Drop here</div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { DayCell } from './DayCell';
import { generateWeekDays, getEventsForDay } from '../utils/calendarHelpers';
import { formatWeekday } from '../utils/dateUtils';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  app: App;
  hoverParent: HoverParent;
}

/**
 * WeekView component displaying a weekly calendar.
 * Shows 7 days (Sunday to Saturday) with events.
 */
export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  app,
  hoverParent,
}) => {
  const days = generateWeekDays(currentDate);

  return (
    <div className="bv-calendar-week-view">
      {/* Weekday header */}
      <div className="bv-calendar-weekday-header">
        {days.map((day) => (
          <div key={day.toISOString()} className="bv-calendar-weekday">
            {formatWeekday(day)}
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="bv-calendar-week-grid">
        {days.map((day) => {
          const dayEvents = getEventsForDay(events, day);

          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              events={dayEvents}
              isCurrentMonth={true} // All days are visible in week view
              app={app}
              hoverParent={hoverParent}
            />
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { DayCell } from './DayCell';
import { generateMonthDays, getEventsForDay, isDayInMonth } from '../utils/calendarHelpers';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  app: App;
  hoverParent: HoverParent;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * MonthView component displaying a monthly calendar grid.
 * Shows 6 weeks (42 days) including padding from adjacent months.
 */
export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  app,
  hoverParent,
}) => {
  const days = generateMonthDays(currentDate);

  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bv-calendar-month-view">
      {/* Weekday header */}
      <div className="bv-calendar-weekday-header">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bv-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bv-calendar-grid">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="bv-calendar-week-row">
            {week.map((day) => {
              const dayEvents = getEventsForDay(events, day);
              const isCurrentMonth = isDayInMonth(day, currentDate);

              return (
                <DayCell
                  key={day.toISOString()}
                  date={day}
                  events={dayEvents}
                  isCurrentMonth={isCurrentMonth}
                  app={app}
                  hoverParent={hoverParent}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

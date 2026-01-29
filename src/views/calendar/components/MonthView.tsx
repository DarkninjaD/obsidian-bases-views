import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDndMonitor } from '@dnd-kit/core';
import { CalendarEvent } from '../../../types/view-config';
import { DayCell } from './DayCell';
import { MultiDayEvent } from './MultiDayEvent';
import { formatDateString } from '../utils/dateUtils';
import { useCalendarDrag } from '../context/CalendarDragContext';
import {
  generateMonthDays,
  getEventsForDay,
  isDayInMonth,
  getMultiDayEventsForWeek,
  calculateEventSpanInWeek,
} from '../utils/calendarHelpers';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  app: App;
  hoverParent: HoverParent;
  dateProperty: string;
  endDateProperty: string;
  /** Callback when user wants to create a new event */
  onCreateEvent?: (date: Date) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * MonthView component displaying a monthly calendar grid.
 * Shows 6 weeks (42 days) including padding from adjacent months.
 * Multi-day events are displayed at the top of each week row.
 */
export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  app,
  hoverParent,
  dateProperty,
  endDateProperty,
  onCreateEvent,
}) => {
  // Ref for week row container (used for resize calculations)
  const weekRowRef = React.useRef<HTMLDivElement>(null);
  // Track which date is being dragged over for full-column highlighting (dnd-kit)
  const [dragOverDate, setDragOverDate] = React.useState<string | null>(null);
  // Get highlighted dates from native drag context
  const { highlightedDates } = useCalendarDrag();
  // Counter to force re-sort after resize/drag ends
  const [sortVersion, setSortVersion] = React.useState(0);

  // Callback to trigger re-sort after interaction ends
  const handleInteractionEnd = React.useCallback(() => {
    // Small delay to allow file changes to propagate
    setTimeout(() => {
      setSortVersion(v => v + 1);
    }, 50);
  }, []);

  useDndMonitor({
    onDragOver(event) {
      const overId = event.over?.id as string | null;
      setDragOverDate(overId);
    },
    onDragEnd() {
      setDragOverDate(null);
    },
    onDragCancel() {
      setDragOverDate(null);
    },
  });

  const days = generateMonthDays(currentDate);

  // Group days into weeks
  const weeks: Date[][] = React.useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Memoize multi-day events per week to prevent re-sorting during drag
  // Only re-compute when events change or sortVersion changes (after drag/resize ends)
  const multiDayEventsByWeek = React.useMemo(() => {
    return weeks.map(week => getMultiDayEventsForWeek(events, week));
  }, [events, weeks, sortVersion]);

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
        {weeks.map((week, weekIndex) => {
          // Use memoized multi-day events to prevent re-sorting during drag
          const multiDayEvents = multiDayEventsByWeek[weekIndex];

          return (
            <div key={weekIndex} className="bv-calendar-week-row" ref={weekRowRef}>
              {/* Full-column drag-over highlights */}
              {week.map((day, dayIndex) => {
                const dateStr = formatDateString(day);
                // Show highlight for dnd-kit drag OR native mouse drag
                const isDragOver = dragOverDate === dateStr || highlightedDates.includes(dateStr);
                if (!isDragOver) return null;
                return (
                  <div
                    key={`highlight-${dateStr}`}
                    className="bv-calendar-day-highlight"
                    style={{ left: `${(dayIndex / 7) * 100}%`, width: `${100 / 7}%` }}
                  />
                );
              })}

              {/* Day numbers row */}
              <div className="bv-calendar-day-numbers-row">
                {week.map((day) => {
                  const dateStr = formatDateString(day);
                  const isCurrentMonth = isDayInMonth(day, currentDate);
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={dateStr}
                      className={`bv-calendar-day-number ${!isCurrentMonth ? 'bv-calendar-day-other-month' : ''} ${isToday ? 'bv-calendar-day-today' : ''}`}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Multi-day events layer below day numbers */}
              {multiDayEvents.length > 0 && (
                <div className="bv-calendar-multi-day-row">
                  {multiDayEvents.map((event, eventIndex) => {
                    const span = calculateEventSpanInWeek(event, week);
                    return (
                      <MultiDayEvent
                        key={event.id}
                        event={event}
                        startCol={span.startCol}
                        colSpan={span.colSpan}
                        row={eventIndex}
                        continuesBefore={span.continuesBefore}
                        continuesAfter={span.continuesAfter}
                        app={app}
                        hoverParent={hoverParent}
                        containerRef={weekRowRef}
                        dateProperty={dateProperty}
                        endDateProperty={endDateProperty}
                        onInteractionEnd={handleInteractionEnd}
                      />
                    );
                  })}
                </div>
              )}

              {/* Day cells with single-day events */}
              <div className="bv-calendar-days-row">
                {week.map((day) => {
                  const dayEvents = getEventsForDay(events, day);
                  const isCurrentMonth = isDayInMonth(day, currentDate);

                  return (
                    <DayCell
                      key={formatDateString(day)}
                      date={day}
                      events={dayEvents}
                      isCurrentMonth={isCurrentMonth}
                      app={app}
                      hoverParent={hoverParent}
                      showDayNumber={false}
                      containerRef={weekRowRef}
                      dateProperty={dateProperty}
                      endDateProperty={endDateProperty}
                      onCreateEvent={onCreateEvent}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

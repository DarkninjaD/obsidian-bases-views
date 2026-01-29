import React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDndMonitor } from '@dnd-kit/core';
import { CalendarEvent } from '../../../types/view-config';
import { DayCell } from './DayCell';
import { MultiDayEvent } from './MultiDayEvent';
import {
  generateWeekDays,
  getEventsForDay,
  getMultiDayEventsForWeek,
  calculateEventSpanInWeek,
} from '../utils/calendarHelpers';
import { formatWeekday, formatDateString } from '../utils/dateUtils';
import { useCalendarDrag } from '../context/CalendarDragContext';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  app: App;
  hoverParent: HoverParent;
  dateProperty: string;
  endDateProperty: string;
  /** Callback when user wants to create a new event */
  onCreateEvent?: (date: Date) => void;
}

/**
 * WeekView component displaying a weekly calendar.
 * Shows 7 days (Monday to Sunday) with events.
 * Multi-day events are displayed at the top of the week.
 */
export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  app,
  hoverParent,
  dateProperty,
  endDateProperty,
  onCreateEvent,
}) => {
  const days = generateWeekDays(currentDate);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track which date is being dragged over for full-column highlighting (dnd-kit)
  const [dragOverDate, setDragOverDate] = React.useState<string | null>(null);
  // Get highlighted dates from native drag context
  const { highlightedDates } = useCalendarDrag();
  // Counter to force re-sort after resize/drag ends
  const [sortVersion, setSortVersion] = React.useState(0);

  // Callback to trigger re-sort after interaction ends
  const handleInteractionEnd = React.useCallback(() => {
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

  // Memoize multi-day events to prevent re-sorting during drag
  const multiDayEvents = React.useMemo(() => {
    return getMultiDayEventsForWeek(events, days);
  }, [events, days, sortVersion]);

  return (
    <div className="bv-calendar-week-view" ref={containerRef}>
      {/* Weekday header */}
      <div className="bv-calendar-weekday-header">
        {days.map((day) => (
          <div key={day.toISOString()} className="bv-calendar-weekday">
            {formatWeekday(day)}
          </div>
        ))}
      </div>

      {/* Week row with multi-day events and day cells */}
      <div className="bv-calendar-week-row">
        {/* Full-column drag-over highlights */}
        {days.map((day, dayIndex) => {
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
          {days.map((day) => {
            const dateStr = formatDateString(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div
                key={dateStr}
                className={`bv-calendar-day-number ${isToday ? 'bv-calendar-day-today' : ''}`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>

        {/* Multi-day events layer */}
        {multiDayEvents.length > 0 && (
          <div className="bv-calendar-multi-day-row">
            {multiDayEvents.map((event, eventIndex) => {
              const span = calculateEventSpanInWeek(event, days);
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
                  containerRef={containerRef}
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
          {days.map((day) => {
            const dayEvents = getEventsForDay(events, day);

            return (
              <DayCell
                key={formatDateString(day)}
                date={day}
                events={dayEvents}
                isCurrentMonth={true}
                app={app}
                hoverParent={hoverParent}
                showDayNumber={false}
                containerRef={containerRef}
                dateProperty={dateProperty}
                endDateProperty={endDateProperty}
                onCreateEvent={onCreateEvent}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

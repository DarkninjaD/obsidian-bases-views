import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { BasesEntry, CalendarEvent } from '../../../types/view-config';
import { parseISO, isValid } from 'date-fns';

/**
 * Generate array of days for month view calendar grid.
 * Includes padding days from previous and next months.
 *
 * @param currentDate - Current date to display
 * @returns Array of days covering the calendar grid
 */
export function generateMonthDays(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Start from Monday of the week containing the first day of month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // End at Sunday of the week containing the last day of month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Generate array of days for week view.
 *
 * @param currentDate - Current date to display
 * @returns Array of 7 days for the week
 */
export function generateWeekDays(currentDate: Date): Date[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Transform entries into calendar events.
 * Filters entries that have a valid date property.
 *
 * @param entries - Array of entries
 * @param dateProperty - Property name for the start date
 * @param endDateProperty - Optional property name for the end date
 * @returns Array of calendar events
 */
export function entriesToEvents(
  entries: BasesEntry[],
  dateProperty: string,
  endDateProperty?: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  entries.forEach((entry) => {
    // Try primary date property first, then fallback to 'date'
    let dateValue = entry.properties[dateProperty];
    if (!dateValue && dateProperty !== 'date') {
      dateValue = entry.properties['date'];
    }
    const date = parseDate(dateValue);

    if (date) {
      // Parse end date if property is specified
      let endDate: Date | undefined;
      if (endDateProperty) {
        const endDateValue = entry.properties[endDateProperty];
        const parsedEndDate = parseDate(endDateValue);
        if (parsedEndDate && parsedEndDate > date) {
          endDate = parsedEndDate;
        }
      }

      events.push({
        id: entry.id,
        file: entry.file,
        title: entry.file.basename,
        date,
        endDate,
      });
    }
  });

  return events;
}

/**
 * Parse a date value from various formats.
 *
 * @param value - Value to parse
 * @returns Date object or null
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
  }

  // Handle DateTime objects (Luxon, moment, etc.)
  if (typeof value === 'object') {
    // Luxon DateTime has ts property
    if (value.ts && typeof value.ts === 'number') {
      return new Date(value.ts);
    }
    // moment has toDate method
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    // Has toISOString method
    if (typeof value.toISOString === 'function') {
      const parsed = parseISO(value.toISOString());
      return isValid(parsed) ? parsed : null;
    }
  }

  return null;
}

/**
 * Group events by date.
 *
 * @param events - Array of events
 * @returns Map of date string to events
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const dateKey = event.date.toISOString().split('T')[0]; // YYYY-MM-DD
    const group = grouped.get(dateKey) || [];
    group.push(event);
    grouped.set(dateKey, group);
  });

  return grouped;
}

/**
 * Check if an event is a multi-day event.
 *
 * @param event - Event to check
 * @returns True if event spans multiple days
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return !!event.endDate && !isSameDay(event.date, event.endDate);
}

/**
 * Check if a day falls within a multi-day event's range.
 *
 * @param event - Event to check
 * @param day - Day to check
 * @returns True if day is within event range
 */
export function isDayInEventRange(event: CalendarEvent, day: Date): boolean {
  if (!event.endDate) {
    return isSameDay(event.date, day);
  }

  const dayStart = startOfDay(day);
  const eventStart = startOfDay(event.date);
  const eventEnd = endOfDay(event.endDate);

  return isWithinInterval(dayStart, { start: eventStart, end: eventEnd });
}

/**
 * Get single-day events for a specific day (excludes multi-day events).
 *
 * @param events - Array of events
 * @param day - Day to filter by
 * @returns Array of single-day events for that day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => !isMultiDayEvent(event) && isSameDay(event.date, day));
}

/**
 * Get multi-day events that span a specific week.
 * Events are sorted by visible span in week (longest first), then by start date.
 *
 * @param events - Array of events
 * @param weekDays - Array of days in the week
 * @returns Array of multi-day events visible in this week, sorted by visible span
 */
export function getMultiDayEventsForWeek(
  events: CalendarEvent[],
  weekDays: Date[]
): CalendarEvent[] {
  if (weekDays.length === 0) return [];

  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = endOfDay(weekDays[weekDays.length - 1]);

  const multiDayEvents = events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = startOfDay(event.date);
    const eventEnd = endOfDay(event.endDate!);

    // Event overlaps with week if:
    // - Event starts before or during week AND
    // - Event ends during or after week start
    return !isAfter(eventStart, weekEnd) && !isBefore(eventEnd, weekStart);
  });

  // Sort by visible span in week (longest first), then by start date (earlier first)
  return multiDayEvents.sort((a, b) => {
    const spanA = calculateEventSpanInWeek(a, weekDays);
    const spanB = calculateEventSpanInWeek(b, weekDays);

    // Primary sort: by visible span (longest first)
    if (spanB.colSpan !== spanA.colSpan) {
      return spanB.colSpan - spanA.colSpan;
    }

    // Secondary sort: by actual start date (earlier first)
    const startDiff = a.date.getTime() - b.date.getTime();
    if (startDiff !== 0) {
      return startDiff;
    }

    // Tertiary sort: by start column (earlier first)
    return spanA.startCol - spanB.startCol;
  });
}

/**
 * Calculate the visual span of a multi-day event within a week.
 *
 * @param event - Multi-day event
 * @param weekDays - Array of days in the week
 * @returns Object with startCol (0-6), colSpan, and whether it continues from/to adjacent weeks
 */
export function calculateEventSpanInWeek(
  event: CalendarEvent,
  weekDays: Date[]
): { startCol: number; colSpan: number; continuesBefore: boolean; continuesAfter: boolean } {
  if (weekDays.length === 0 || !event.endDate) {
    return { startCol: 0, colSpan: 1, continuesBefore: false, continuesAfter: false };
  }

  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = startOfDay(weekDays[weekDays.length - 1]);
  const eventStart = startOfDay(event.date);
  const eventEnd = startOfDay(event.endDate);

  // Determine if event continues from previous week or to next week
  const continuesBefore = isBefore(eventStart, weekStart);
  const continuesAfter = isAfter(eventEnd, weekEnd);

  // Calculate start column (0-6)
  let startCol = 0;
  if (!continuesBefore) {
    startCol = weekDays.findIndex((day) => isSameDay(day, eventStart));
    if (startCol === -1) startCol = 0;
  }

  // Calculate end column
  let endCol = 6;
  if (!continuesAfter) {
    endCol = weekDays.findIndex((day) => isSameDay(day, eventEnd));
    if (endCol === -1) endCol = 6;
  }

  const colSpan = endCol - startCol + 1;

  return { startCol, colSpan, continuesBefore, continuesAfter };
}

/**
 * Check if a day is in the current month.
 *
 * @param day - Day to check
 * @param currentMonth - Current month date
 * @returns True if day is in current month
 */
export function isDayInMonth(day: Date, currentMonth: Date): boolean {
  return isSameMonth(day, currentMonth);
}

/**
 * Check if a day is today.
 *
 * @param day - Day to check
 * @returns True if day is today
 */
export function isDayToday(day: Date): boolean {
  return isToday(day);
}

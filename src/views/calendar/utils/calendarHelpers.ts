import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
  subDays,
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

  // Start from Sunday of the week containing the first day of month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });

  // End at Saturday of the week containing the last day of month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Generate array of days for week view.
 *
 * @param currentDate - Current date to display
 * @returns Array of 7 days for the week
 */
export function generateWeekDays(currentDate: Date): Date[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Transform entries into calendar events.
 * Filters entries that have a valid date property.
 *
 * @param entries - Array of entries
 * @param dateProperty - Property name for the date
 * @returns Array of calendar events
 */
export function entriesToEvents(
  entries: BasesEntry[],
  dateProperty: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  console.log('entriesToEvents: processing', entries.length, 'entries');
  console.log('entriesToEvents: looking for dateProperty:', dateProperty);

  entries.forEach((entry, index) => {
    console.log(`entriesToEvents: entry ${index}:`, entry);
    console.log(`entriesToEvents: entry ${index} properties:`, entry.properties);

    const dateValue = entry.properties[dateProperty];
    console.log(`entriesToEvents: entry ${index} dateValue for '${dateProperty}':`, dateValue);

    const date = parseDate(dateValue);
    console.log(`entriesToEvents: entry ${index} parsed date:`, date);

    if (date) {
      events.push({
        id: entry.id,
        file: entry.file,
        title: entry.file.basename,
        date,
      });
      console.log(`entriesToEvents: ✓ added event for entry ${index}`);
    } else {
      console.log(`entriesToEvents: ✗ skipped entry ${index} - no valid date`);
    }
  });

  console.log('entriesToEvents: returning', events.length, 'events');
  return events;
}

/**
 * Parse a date value from various formats.
 *
 * @param value - Value to parse
 * @returns Date object or null
 */
function parseDate(value: any): Date | null {
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
 * Get events for a specific day.
 *
 * @param events - Array of events
 * @param day - Day to filter by
 * @returns Array of events for that day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => isSameDay(event.date, day));
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

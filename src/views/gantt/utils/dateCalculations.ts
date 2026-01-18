import { startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, addDays, format } from 'date-fns';
import { Task } from '../../../types/view-config';

/**
 * Calculate the timeline range that encompasses all tasks.
 * Returns start and end dates with some padding.
 *
 * @param tasks - Array of tasks with start/end dates
 * @returns Tuple of [startDate, endDate]
 */
export function calculateTimelineRange(tasks: Task[]): [Date, Date] {
  if (tasks.length === 0) {
    // No tasks, return current month
    const now = new Date();
    return [startOfMonth(now), endOfMonth(now)];
  }

  // Find earliest start date and latest end date
  const allDates = tasks.flatMap((t) => [t.startDate, t.endDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Add padding: start of month for min, end of month for max
  return [startOfMonth(minDate), endOfMonth(maxDate)];
}

/**
 * Calculate position and width of a task bar on the timeline.
 * Returns percentage values for CSS positioning.
 *
 * @param taskStart - Task start date
 * @param taskEnd - Task end date
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @returns Object with left and width percentages
 */
export function calculateTaskPosition(
  taskStart: Date,
  taskEnd: Date,
  timelineStart: Date,
  timelineEnd: Date
): { left: number; width: number } {
  const timelineSpan = differenceInDays(timelineEnd, timelineStart);
  const taskStartOffset = differenceInDays(taskStart, timelineStart);
  const taskSpan = differenceInDays(taskEnd, taskStart);

  // Ensure minimum 1 day width
  const effectiveTaskSpan = Math.max(taskSpan, 1);

  return {
    left: (taskStartOffset / timelineSpan) * 100,
    width: (effectiveTaskSpan / timelineSpan) * 100,
  };
}

/**
 * Generate timeline day markers for the header.
 *
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @returns Array of day marker objects
 */
export function generateTimelineMarkers(
  timelineStart: Date,
  timelineEnd: Date
): Array<{ date: Date; label: string; isMonthStart: boolean }> {
  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });

  return days.map((date) => ({
    date,
    label: format(date, 'd'),
    isMonthStart: date.getDate() === 1,
  }));
}

/**
 * Calculate new date from pixel delta during resize.
 *
 * @param originalDate - Original date before resize
 * @param pixelDelta - Pixel movement
 * @param pixelsPerDay - Pixels representing one day
 * @returns New date
 */
export function calculateDateFromDelta(
  originalDate: Date,
  pixelDelta: number,
  pixelsPerDay: number
): Date {
  const daysDelta = Math.round(pixelDelta / pixelsPerDay);
  return addDays(originalDate, daysDelta);
}
